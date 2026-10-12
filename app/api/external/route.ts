import { NextRequest, NextResponse } from 'next/server';
import { researchExternal } from '@/lib/external/research';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Send companyName, url, or both.' }, { status: 400 });
    const companyName = typeof body.companyName === 'string' ? body.companyName.trim().slice(0,180) : '';
    const url = typeof body.url === 'string' ? body.url.trim().slice(0,2048) : '';
    if (!companyName && !url) return NextResponse.json({ error: 'Enter a company name, website URL, or both.' }, { status: 400 });
    const report = await researchExternal({ companyName: companyName || undefined, url: url || undefined });
    return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'External research failed.';
    console.error('[External] Research failed:', message);
    return NextResponse.json({ error: message }, { status: /missing|not allowed|valid company website|enter a company/i.test(message) ? 400 : 502 });
  }
}
