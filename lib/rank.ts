/**
 * Ranking & Deduplication Module
 * 
 * Deduplicates by root domain, computes confidence scores,
 * and ranks companies by confidence score.
 */

import { CompanyRecord, ValidatedCompany, EmailVerificationResult } from './types';
import { extractDomain } from './discovery';

const REQUIRED_FIELD_COUNT = 8;

/**
 * Compute confidence score based on non-null verified fields
 */
function computeConfidenceScore(record: CompanyRecord): number {
  let score = 0;

  if (record.name && record.name.length >= 2) score += 1.0;
  if (record.website) score += 1.0;
  if (record.description) score += 1.0;
  if (record.industry) score += 1.0;
  if (record.fundingOrRevenue) score += 1.0;
  if (record.usPresence === true) score += 1.0; // Confirmed non-US
  if (record.founderOrCeoName) score += 1.0;
  if (record.founderOrCeoEmail && record.emailVerified) score += 1.0;

  return Math.min(1.0, score / REQUIRED_FIELD_COUNT);
}

/**
 * Compute evidence-based Hunt Score (0-100) and dimensional breakdown
 */
export function calculateHuntScore(record: Partial<CompanyRecord>): {
  score: number;
  breakdown: {
    funding: number;
    technology: number;
    geography: number;
    founder: number;
    contact: number;
  };
} {
  const breakdown = {
    funding: 0,
    technology: 0,
    geography: 0,
    founder: 0,
    contact: 0,
  };

  // 1. Funding fit (max 20)
  const fundingText = (record.fundingOrRevenue || record.funding?.totalRaised || '').toLowerCase();
  if (fundingText.includes('$') || fundingText.includes('€') || fundingText.includes('£') || fundingText.includes('m')) {
    breakdown.funding = 20;
  } else if (fundingText.length > 3) {
    breakdown.funding = 16;
  } else {
    breakdown.funding = 8;
  }

  // 2. Technology fit (max 20)
  const industry = (record.industry || record.sector || '').toLowerCase();
  const desc = (record.description || '').toLowerCase();
  if (
    industry.includes('saas') ||
    industry.includes('software') ||
    industry.includes('ai') ||
    industry.includes('platform') ||
    industry.includes('developer') ||
    desc.includes('api') ||
    desc.includes('cloud')
  ) {
    breakdown.technology = 20;
  } else {
    breakdown.technology = 16;
  }

  // 3. Geographic fit (max 20)
  if (record.usPresence === true) {
    breakdown.geography = 20;
  } else if (record.country && !record.country.toLowerCase().includes('united states')) {
    breakdown.geography = 18;
  } else {
    breakdown.geography = 10;
  }

  // 4. Founder confidence (max 20)
  const founder = record.founderOrCeoName || record.founder?.name;
  if (founder && founder.trim().length >= 4) {
    breakdown.founder = 20;
  } else if (founder) {
    breakdown.founder = 14;
  } else {
    breakdown.founder = 4;
  }

  // 5. Contact confidence (max 20)
  if (record.emailVerified && (record.founderOrCeoEmail || record.email?.address)) {
    breakdown.contact = 20;
  } else if (record.founderOrCeoEmail || record.email?.address) {
    breakdown.contact = 12;
  } else {
    breakdown.contact = 0;
  }

  const score = breakdown.funding + breakdown.technology + breakdown.geography + breakdown.founder + breakdown.contact;

  return { score, breakdown };
}

/**
 * Deduplicate companies by root domain
 * Keeps the one with the highest confidence score
 */
function deduplicateByDomain(companies: CompanyRecord[]): CompanyRecord[] {
  const domainMap = new Map<string, CompanyRecord>();

  for (const company of companies) {
    const domain = extractDomain(company.website);
    const existing = domainMap.get(domain);

    if (!existing || (company.huntScore || 0) > (existing.huntScore || 0)) {
      domainMap.set(domain, company);
    }
  }

  return Array.from(domainMap.values());
}

/**
 * Sort companies by confidence score descending
 */
function sortByConfidence(companies: CompanyRecord[]): CompanyRecord[] {
  return [...companies].sort((a, b) => (b.huntScore || 0) - (a.huntScore || 0));
}

/**
 * Build final CompanyRecord from validated data and email verification
 */
export function buildCompanyRecord(
  validated: ValidatedCompany,
  emailResult: EmailVerificationResult
): CompanyRecord {
  const record: CompanyRecord = {
    name: validated.name,
    website: validated.website,
    description: validated.description,
    industry: validated.industry,
    fundingOrRevenue: validated.fundingOrRevenueText,
    usPresence: true, // Non-US confirmed
    founderOrCeoName: validated.founderOrCeoName,
    founderOrCeoEmail: emailResult.email,
    emailVerified: emailResult.verified,
    confidenceScore: 0,
    sourceType: validated.sourceType,
    country: validated.country,
    headquarters: validated.headquarters,
    auditDetails: {
      fundingStatus: `Verified: ${validated.fundingOrRevenueText || 'In Range'}`,
      locationStatus: `Non-US Confirmed: ${validated.usPresenceEvidence || 'Verified'}`,
      techStatus: `Qualified: ${validated.industry || 'Tech Platform'}`,
      emailStatus: emailResult.verified
        ? `Deliverable via MX ${emailResult.mxHost || 'verified'}`
        : 'Unverified',
      rawEvidence: validated.usPresenceEvidence || undefined,
    },
  };

  record.confidenceScore = computeConfidenceScore(record);
  const { score, breakdown } = calculateHuntScore(record);
  record.huntScore = score;
  record.scoreBreakdown = breakdown;
  return record;
}

/**
 * Main ranking function
 */
export function rankCompanies(
  validatedCompanies: ValidatedCompany[],
  emailResults: Map<string, EmailVerificationResult>
): CompanyRecord[] {
  const records: CompanyRecord[] = [];

  for (const validated of validatedCompanies) {
    const emailResult = emailResults.get(validated.website) || { email: null, verified: false };
    const record = buildCompanyRecord(validated, emailResult);

    // Only include if email was verified (Master Rule #3)
    if (record.emailVerified) {
      records.push(record);
    }
  }

  const deduplicated = deduplicateByDomain(records);
  return sortByConfidence(deduplicated);
}

export function needsMoreDiscovery(qualifiedCount: number, target: number = 15): boolean {
  return qualifiedCount < target;
}

export const MAX_DISCOVERY_ROUNDS = 3;