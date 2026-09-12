/**
 * API Route: /api/run-agent
 * 
 * Orchestrates the full company discovery pipeline:
 * Discovery → Extraction → Validation → Email Verification → Dedupe/Rank
 * Supports both JSON response and Server-Sent Events (SSE) streaming for real-time UI telemetry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { discoverCompanies } from '@/lib/discovery';
import { extractAllCandidates } from '@/lib/extraction';
import { validateCompany } from '@/lib/validation';
import { findVerifiedEmail } from '@/lib/email';
import { rankCompanies, needsMoreDiscovery, MAX_DISCOVERY_ROUNDS } from '@/lib/rank';
import { RunAgentResult, ValidatedCompany, CompanyRecord } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface PipelineStats {
  discovered: number;
  extracted: number;
  nonUsPassed: number;
  fundingQualified: number;
  founderFound: number;
  emailVerified: number;
  finalRanked: number;
  durationMs: number;
}

/**
 * Full execution logic with optional streaming writer
 */
async function executePipeline(
  onEvent?: (event: { type: string; message: string; stage?: number; stageName?: string; company?: CompanyRecord; stats?: PipelineStats }) => void
): Promise<RunAgentResult> {
  const startTime = Date.now();
  const allValidated: ValidatedCompany[] = [];
  const allRankedCompanies: CompanyRecord[] = [];

  const stats: PipelineStats = {
    discovered: 0,
    extracted: 0,
    nonUsPassed: 0,
    fundingQualified: 0,
    founderFound: 0,
    emailVerified: 0,
    finalRanked: 0,
    durationMs: 0,
  };

  const log = (message: string, stage = 0, stageName = '') => {
    console.log(`[Agent] ${message}`);
    if (onEvent) {
      onEvent({ type: 'log', message, stage, stageName, stats });
    }
  };

  log('Initializing Autonomous Company Discovery Agent...', 0, 'Initialization');

  for (let round = 1; round <= MAX_DISCOVERY_ROUNDS; round++) {
    log(`[Round ${round}] Commencing multi-source candidate discovery...`, 1, 'Discovery');

    // 1. Discovery
    const candidates = await discoverCompanies();
    stats.discovered += candidates.length;
    log(`[Round ${round}] Found ${candidates.length} candidate URLs across discovery feeds`, 1, 'Discovery');

    if (candidates.length === 0) {
      log(`[Round ${round}] No further candidates in this round.`, 1, 'Discovery');
      break;
    }

    // 2. Extraction
    log(`[Round ${round}] Extracting structured profiles for ${candidates.length} candidates (concurrency: 5)...`, 2, 'Extraction');
    const extractedMap = await extractAllCandidates(candidates, 5);
    stats.extracted += extractedMap.size;
    log(`[Round ${round}] Successfully extracted ${extractedMap.size} company profiles`, 2, 'Extraction');

    // 3. Validation
    log(`[Round ${round}] Applying strict deterministic criteria ($1M-$5M, Non-US, Tech Platform, Founder name)...`, 3, 'Validation');
    const roundValidated: ValidatedCompany[] = [];

    for (const [url, data] of extractedMap.entries()) {
      const candidate = candidates.find(c => c.url === url);
      const validated = validateCompany(data, url, candidate?.source || 'Discovery');

      if (validated) {
        stats.nonUsPassed++;
        stats.fundingQualified++;
        stats.founderFound++;
        roundValidated.push(validated);
        log(`✓ Qualified criteria: ${validated.name} (${validated.industry}, ${validated.fundingOrRevenueText || '$1M-$5M'})`, 3, 'Validation');
      }
    }

    log(`[Round ${round}] Validated ${roundValidated.length} companies against all target criteria`, 3, 'Validation');
    allValidated.push(...roundValidated);

    if (roundValidated.length === 0) {
      if (!needsMoreDiscovery(allRankedCompanies.length, 15)) break;
      continue;
    }

    // 4. Email Verification
    log(`[Round ${round}] Verifying founder/CEO emails with DNS MX lookups...`, 4, 'Email Verification');
    const emailResults = new Map<string, { email: string | null; verified: boolean; mxHost?: string | null }>();

    for (const comp of roundValidated) {
      const emailRes = await findVerifiedEmail(comp.founderOrCeoName || 'Founder', comp.website);
      emailResults.set(comp.website, emailRes);

      if (emailRes.verified && emailRes.email) {
        stats.emailVerified++;
        log(`✓ Email deliverable: ${emailRes.email} for ${comp.name} [MX: ${emailRes.mxHost || 'Verified'}]`, 4, 'Email Verification');
      }
    }

    // 5. Ranking and Deduplication
    log(`[Round ${round}] Deduplicating and computing confidence scores...`, 5, 'Ranking');
    const ranked = rankCompanies(roundValidated, emailResults);

    for (const comp of ranked) {
      allRankedCompanies.push(comp);
      if (onEvent) {
        onEvent({ type: 'candidate_found', message: `Qualified: ${comp.name}`, company: comp, stats });
      }
    }

    // Check if target met
    if (!needsMoreDiscovery(allRankedCompanies.length, 15)) {
      log(`Target reached! ${allRankedCompanies.length} fully qualified companies discovered.`, 5, 'Ranking');
      break;
    }
  }

  // Deduplicate across all rounds
  const domainMap = new Map<string, CompanyRecord>();
  for (const comp of allRankedCompanies) {
    try {
      const domain = new URL(comp.website.startsWith('http') ? comp.website : `https://${comp.website}`).hostname.replace(/^www\./, '');
      const existing = domainMap.get(domain);
      if (!existing || comp.confidenceScore > existing.confidenceScore) {
        domainMap.set(domain, comp);
      }
    } catch {
      domainMap.set(comp.name, comp);
    }
  }

  const finalCompanies = Array.from(domainMap.values())
    .sort((a, b) => b.confidenceScore - a.confidenceScore);

  stats.finalRanked = finalCompanies.length;
  stats.durationMs = Date.now() - startTime;

  log(`Pipeline finished in ${(stats.durationMs / 1000).toFixed(1)}s. Total qualified: ${finalCompanies.length}`, 5, 'Complete');

  return {
    companies: finalCompanies,
    totalDiscovered: stats.discovered,
    totalQualified: finalCompanies.length,
    stats,
  };
}

export async function POST(request: NextRequest) {
  const isStream = request.nextUrl.searchParams.get('stream') === 'true' ||
    request.headers.get('accept')?.includes('text/event-stream');

  if (isStream) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: any) => {
      try {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
      } catch {}
    };

    (async () => {
      try {
        const result = await executePipeline((event) => {
          sendEvent(event);
        });
        await sendEvent({ type: 'complete', message: 'Pipeline complete', result });
      } catch (err: any) {
        await sendEvent({ type: 'error', message: err.message || 'Pipeline execution failed' });
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  }

  // Standard JSON response
  try {
    const result = await executePipeline();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Pipeline execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}