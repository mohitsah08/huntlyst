/**
 * Validation Module
 * 
 * Deterministic validation functions for company qualification criteria:
 * - Funding between $1,000,000 and $5,000,000 USD (multi-currency normalized)
 * - Tech platform business model
 * - Confirmed non-US presence (undetermined is rejected per Master Rules)
 * - Required company name and founder/CEO name
 */

import { ExtractedCompanyData, ValidatedCompany } from './types';

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

export function checkFundingRange(fundingText: string | null): boolean {
  const amount = parseFundingAmount(fundingText);
  if (amount === null) return false;
  return amount >= MIN_FUNDING_USD && amount <= MAX_FUNDING_USD;
}

export function checkTechPlatform(description: string | null, industry: string | null): boolean {
  const text = `${description || ''} ${industry || ''}`.toLowerCase();
  if (!text.trim()) return false;
  return TECH_PLATFORM_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Deterministic US Presence Check:
 * - true  => US presence detected (FAILED criteria)
 * - false => Confirmed Non-US (PASSED criteria)
 * - null  => Undetermined (treated as REJECT per Master Rule #2)
 */
export function checkNoUSPresence(
  evidenceText: string | null,
  websiteUrl: string
): boolean | null {
  const text = (evidenceText || '').toLowerCase();

  // Strong US signals
  const usStateNames = /\b(california|texas|new york|florida|illinois|massachusetts|washington state|delaware|nevada|san francisco|silicon valley|austin|seattle|boston|los angeles|chicago)\b/i;
  const usPhonePattern = /\+1[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/;
  const usAddressWords = /\b(headquartered in the us|based in the us|united states|usa office|u\.s\.[\s-]based|us headquarters)\b/i;

  if (usStateNames.test(text) || usPhonePattern.test(text) || usAddressWords.test(text)) {
    return true; // Confident US presence -> Fails check
  }

  // Strong non-US signals: Countries & Global Tech Hubs
  const nonUsLocations = /\b(uk|united kingdom|britain|london|manchester|cambridge|oxford|germany|berlin|munich|cologne|hamburg|frankfurt|france|paris|lyon|marseille|netherlands|amsterdam|rotterdam|switzerland|zurich|lausanne|geneva|sweden|stockholm|finland|helsinki|estonia|tallinn|romania|cluj|bucharest|poland|warsaw|krakow|spain|madrid|barcelona|italy|milan|rome|belgium|brussels|austria|vienna|denmark|copenhagen|norway|oslo|ireland|dublin|israel|tel aviv|singapore|india|bengaluru|bangalore|mumbai|delhi|pune|hyderabad|australia|sydney|melbourne|brisbane|canada|toronto|vancouver|montreal|south korea|seoul|japan|tokyo|uae|dubai|brazil|sao paulo)\b/i;
  const nonUsPhoneCode = /\+(?!1\b)\d{1,3}[\s-]?\d/;

  let domainTld = '';
  try {
    domainTld = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname.split('.').pop() || '';
  } catch {}

  const nonUsTlds = ['uk', 'de', 'fr', 'nl', 'se', 'ch', 'fi', 'ee', 'ro', 'pl', 'es', 'it', 'be', 'at', 'dk', 'no', 'ie', 'il', 'sg', 'in', 'au', 'ca', 'kr', 'jp', 'ae', 'br'];

  if (nonUsLocations.test(text) || nonUsPhoneCode.test(text)) {
    return false; // Confident Non-US -> Passes check
  }

  if (nonUsTlds.includes(domainTld)) {
    return false; // Confident Non-US ccTLD -> Passes check
  }

  return null; // Undetermined -> Master Rule #2 requires rejection
}

/**
 * Validate all criteria for a candidate
 */
export function validateCompany(
  data: ExtractedCompanyData,
  websiteUrl: string,
  sourceType: string = 'Discovery'
): ValidatedCompany | null {
  // 1. Funding range check ($1M - $5M)
  if (!checkFundingRange(data.fundingOrRevenueText)) {
    return null;
  }

  // 2. Tech platform check
  if (!checkTechPlatform(data.description, data.industry)) {
    return null;
  }

  // 3. Confirmed non-US presence
  const usPresence = checkNoUSPresence(data.usPresenceEvidence, websiteUrl);
  if (usPresence !== false) {
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
  };
}