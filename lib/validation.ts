/**
 * Validation Module
 * 
 * Deterministic validation functions for company qualification:
 * - Dynamic funding range checking ($min–$max USD)
 * - Dynamic technology profile & sector validation
 * - Deterministic geography & country verification against HuntConfig
 * - Deterministic US presence evaluation (strictly_none, minimal_or_none, limited, any)
 * - Deterministic founder/CEO role qualification
 */

import { ExtractedCompanyData, ValidatedCompany, HuntConfig, TVB_EVALUATION_CONFIG } from './types';
import { detectCountryFromEvidence, findCountry } from './geography';

export const MIN_FUNDING_USD = 1_000_000;
export const MAX_FUNDING_USD = 5_000_000;

/**
 * Tech platform keywords for validation
 */
export const TECH_PLATFORM_KEYWORDS = [
  'software',
  'saas',
  'platform',
  'marketplace',
  'api',
  'app',
  'application',
  'fintech',
  'healthtech',
  'edtech',
  'proptech',
  'insurtech',
  'regtech',
  'martech',
  'hrtech',
  'legaltech',
  'agritech',
  'foodtech',
  'cleantech',
  'greentech',
  'biotech',
  'medtech',
  'ai',
  'artificial intelligence',
  'machine learning',
  'ml',
  'data',
  'analytics',
  'cloud',
  'devops',
  'cybersecurity',
  'security',
  'blockchain',
  'crypto',
  'web3',
  'iot',
  'robotics',
  'automation',
  'b2b',
  'enterprise software',
  'developer tools',
  'infrastructure',
];

const AI_KEYWORDS = [
  'ai',
  'artificial intelligence',
  'machine learning',
  'ml',
  'genai',
  'llm',
  'deep learning',
  'neural',
  'nlp',
  'computer vision',
  'data product',
];

/**
 * Parses funding text into numeric USD value.
 * Supports $, €, £, A$, C$, S$, and plain number representations.
 */
export function parseFundingAmount(text: string | null): number | null {
  if (!text) return null;

  const clean = text.toLowerCase();

  // Exchange rate approximations to USD
  let multiplier = 1.0;
  if (clean.includes('€') || clean.includes('eur') || clean.includes('euro')) {
    multiplier = 1.08;
  } else if (clean.includes('£') || clean.includes('gbp') || clean.includes('pound')) {
    multiplier = 1.28;
  } else if (clean.includes('a$') || clean.includes('aud')) {
    multiplier = 0.67;
  } else if (clean.includes('c$') || clean.includes('cad')) {
    multiplier = 0.74;
  } else if (clean.includes('s$') || clean.includes('sgd')) {
    multiplier = 0.76;
  }

  // Pattern: e.g. "$2.5M", "€3.5 million", "2.8 million", "$4M"
  const millionPattern = /([€$£]|a\$|c\$|s\$)?\s*([\d,]+\.?\d*)\s*(million|m)\b/i;
  const rawNumberPattern = /([€$£]|a\$|c\$|s\$)?\s*([\d,]{4,})/;

  const millionMatch = clean.match(millionPattern);
  if (millionMatch) {
    const num = parseFloat(millionMatch[2].replace(/,/g, ''));
    if (!isNaN(num)) return num * 1_000_000 * multiplier;
  }

  const rawMatch = clean.match(rawNumberPattern);
  if (rawMatch) {
    const num = parseFloat(rawMatch[2].replace(/,/g, ''));
    if (!isNaN(num)) return num * multiplier;
  }

  return null;
}

/**
 * Check funding range against dynamic min/max
 */
export function checkFundingRange(
  fundingText: string | null,
  min: number = MIN_FUNDING_USD,
  max: number = MAX_FUNDING_USD
): boolean {
  const amount = parseFundingAmount(fundingText);
  if (amount === null) return false;
  return amount >= min && amount <= max;
}

/**
 * Check tech platform and sector fit
 */
export function checkTechPlatform(
  description: string | null,
  industry: string | null,
  profile: HuntConfig['techProfile'] = 'platform_required',
  sectors: string[] = ['all']
): boolean {
  const text = `${description || ''} ${industry || ''}`.toLowerCase();
  if (!text.trim()) return false;

  // Sector matching if specific sectors provided
  const activeSectors = sectors.filter(s => s !== 'all' && s !== 'All sectors');
  if (activeSectors.length > 0) {
    const matchesSector = activeSectors.some(sec => text.includes(sec.toLowerCase()));
    if (!matchesSector) {
      // Fallback: check general tech keyword
      const hasTechKeyword = TECH_PLATFORM_KEYWORDS.some(kw => text.includes(kw));
      if (!hasTechKeyword) return false;
    }
  }

  if (profile === 'ai_first') {
    return AI_KEYWORDS.some(kw => text.includes(kw));
  }

  if (profile === 'software_only') {
    return text.includes('software') || text.includes('saas') || text.includes('app');
  }

  return TECH_PLATFORM_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Deterministic US Presence Check:
 * - true  => US presence detected
 * - false => Confirmed Non-US
 * - null  => Undetermined
 */
export function checkNoUSPresence(
  evidenceText: string | null,
  websiteUrl: string,
  mode: HuntConfig['geography']['usPresence'] = 'minimal_or_none'
): boolean | null {
  const text = (evidenceText || '').toLowerCase();

  // If user allows any US presence, always pass unless explicitly excluded
  if (mode === 'any') {
    return false;
  }

  // Strong US signals
  const usStateNames = /\b(california|texas|new york|florida|illinois|massachusetts|washington state|delaware|nevada|san francisco|silicon valley|austin|seattle|boston|los angeles|chicago)\b/i;
  const usPhonePattern = /\+1[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;
  const usAddressWords = /\b(headquartered in the us|based in the us|united states|usa office|u\.s\.[\s-]based|us headquarters)\b/i;

  const hasStrongUsSignal = usStateNames.test(text) || usPhonePattern.test(text) || usAddressWords.test(text);

  if (hasStrongUsSignal) {
    if (mode === 'strictly_none' || mode === 'minimal_or_none') {
      return true; // Fails
    }
  }

  // Strong non-US signals: Countries & Global Tech Hubs
  const detected = detectCountryFromEvidence(evidenceText, websiteUrl);
  if (detected && detected.code !== 'US') {
    return false; // Confirmed Non-US -> Passes
  }

  return null; // Undetermined
}

/**
 * Geography Validation against HuntConfig
 */
export function checkGeographyMatch(
  evidenceText: string | null,
  websiteUrl: string,
  config: HuntConfig
): { passed: boolean; detectedCountry?: string; detectedRegion?: string; reason?: string } {
  const detected = detectCountryFromEvidence(evidenceText, websiteUrl);
  const detectedName = detected ? detected.name : null;
  const detectedRegion = detected ? detected.region : null;

  const targetCountries = (config.geography.countries || []).map(c => c.toLowerCase());
  const targetRegions = (config.geography.regions || []).map(r => r.toLowerCase());
  const excluded = (config.geography.excludedCountries || []).map(e => e.toLowerCase());

  // Check Exclusions
  if (detectedName && excluded.includes(detectedName.toLowerCase())) {
    return { passed: false, detectedCountry: detectedName, reason: `Excluded country: ${detectedName}` };
  }

  // If United States excluded and detected is US
  if (excluded.includes('united states') && (detectedName === 'United States' || checkNoUSPresence(evidenceText, websiteUrl, config.geography.usPresence) === true)) {
    return { passed: false, detectedCountry: 'United States', reason: 'US presence detected while US is excluded' };
  }

  // If specific countries are requested:
  if (targetCountries.length > 0) {
    if (!detectedName || !targetCountries.includes(detectedName.toLowerCase())) {
      return { passed: false, detectedCountry: detectedName || undefined, reason: `Country does not match target: ${config.geography.countries.join(', ')}` };
    }
  }
  // If specific regions are requested:
  else if (targetRegions.length > 0) {
    if (!detectedRegion || !targetRegions.includes(detectedRegion.toLowerCase())) {
      return { passed: false, detectedRegion: detectedRegion || undefined, reason: `Region does not match target: ${config.geography.regions.join(', ')}` };
    }
  }

  // Validate US presence policy
  const usPresence = checkNoUSPresence(evidenceText, websiteUrl, config.geography.usPresence);
  if (config.geography.usPresence === 'strictly_none' && usPresence !== false) {
    return { passed: false, reason: 'Strictly no US presence required' };
  }
  if (config.geography.usPresence === 'minimal_or_none' && usPresence === true) {
    return { passed: false, reason: 'Significant US headquarters detected' };
  }

  return { passed: true, detectedCountry: detectedName || 'Global', detectedRegion: detectedRegion || 'Global' };
}

/**
 * Validate all criteria for a candidate according to active HuntConfig
 */
export function validateCompany(
  data: ExtractedCompanyData,
  websiteUrl: string,
  sourceType: string = 'Discovery',
  config: HuntConfig = TVB_EVALUATION_CONFIG
): ValidatedCompany | null {
  // 1. Funding range check ($min - $max)
  if (!checkFundingRange(data.fundingOrRevenueText, config.funding.min, config.funding.max)) {
    return null;
  }

  // 2. Tech platform & sector check
  if (!checkTechPlatform(data.description, data.industry, config.techProfile, config.sectors)) {
    return null;
  }

  // 3. Deterministic Geography check
  const geoVerdict = checkGeographyMatch(
    `${data.usPresenceEvidence || ''} ${data.headquarters || ''} ${data.country || ''}`,
    websiteUrl,
    config
  );
  if (!geoVerdict.passed) {
    return null;
  }

  // 4. Founder / CEO name present
  if (!data.founderOrCeoName || data.founderOrCeoName.trim().length < 2) {
    return null;
  }

  // 5. Company name present
  if (!data.name || data.name.trim().length < 2) {
    return null;
  }

  return {
    name: data.name.trim(),
    website: websiteUrl,
    description: data.description,
    industry: data.industry || 'Tech Platform',
    fundingOrRevenueText: data.fundingOrRevenueText,
    usPresenceEvidence: data.usPresenceEvidence,
    founderOrCeoName: data.founderOrCeoName.trim(),
    sourceType,
    country: geoVerdict.detectedCountry || data.country || 'Non-US',
    headquarters: data.headquarters || geoVerdict.detectedCountry || 'International',
  };
}