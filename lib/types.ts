/**
 * Core types for the TVB Company Discovery Agent
 */

export interface CandidateUrl {
  url: string;
  snippet: string;
  source: string;
}

export interface DiscoverySource {
  name: string;
  discover(): Promise<{ url: string; snippet: string }[]>;
}

export interface ExtractedCompanyData {
  name: string | null;
  description: string | null;
  industry: string | null;
  fundingOrRevenueText: string | null;
  usPresenceEvidence: string | null;
  founderOrCeoName: string | null;
  country?: string | null;
  headquarters?: string | null;
}

export interface ValidatedCompany {
  name: string;
  website: string;
  description: string | null;
  industry: string | null;
  fundingOrRevenueText: string | null;
  usPresenceEvidence: string | null;
  founderOrCeoName: string | null;
  sourceType: string;
  country?: string | null;
  headquarters?: string | null;
}

export interface EmailVerificationResult {
  email: string | null;
  verified: boolean;
  mxHost?: string | null;
  method?: string;
}

export type CompanyRecord = {
  name: string;
  website: string;
  description: string | null;
  industry: string | null;
  fundingOrRevenue: string | null;
  usPresence: boolean | null; // true means non-US (passes), false means US (rejected)
  founderOrCeoName: string | null;
  founderOrCeoEmail: string | null;
  emailVerified: boolean;
  confidenceScore: number;
  huntScore?: number; // 0–100 derived qualification score
  scoreBreakdown?: {
    funding: number; // max 20
    technology: number; // max 20
    geography: number; // max 20
    founder: number; // max 20
    contact: number; // max 20
  };
  sourceType: string;
  country?: string | null;
  headquarters?: string | null;
  auditDetails?: {
    fundingStatus: string;
    locationStatus: string;
    techStatus: string;
    emailStatus: string;
    rawEvidence?: string;
  };
  // Normalized & enriched fields for complete view interoperability
  sector?: string;
  location?: string;
  employeeCount?: string | number;
  funding?: {
    totalRaised?: string;
    stage?: string;
    lastRoundDate?: string;
    investors?: string[];
    revenue?: string;
    source?: string;
  };
  validation?: {
    isTechPlatform?: boolean;
    hasMinFunding?: boolean;
    isNonUS?: boolean;
    hasFounder?: boolean;
    hasVerifiedEmail?: boolean;
    overallQualified?: boolean;
    confidenceScore?: number;
    checks?: {
      funding?: { passed?: boolean; evidence?: string };
      technology?: { passed?: boolean; evidence?: string };
      geography?: { passed?: boolean; usPresence?: string; evidence?: string };
      founder?: { passed?: boolean; evidence?: string };
      email?: { passed?: boolean; evidence?: string };
    };
  };
  founder?: {
    name?: string;
    title?: string;
    linkedinUrl?: string;
    confidence?: number;
  };
  email?: {
    address?: string;
    status?: string;
    pattern?: string;
    mxRecord?: string;
    confidence?: number;
  };
  evidence?: {
    fundingSource?: string;
    techEvidence?: string;
    geoEvidence?: string;
    founderSource?: string;
    emailVerificationDetail?: string;
    sources?: string[];
  };
};

export interface RunAgentResult {
  companies: CompanyRecord[];
  totalDiscovered: number;
  totalQualified: number;
  stats?: {
    discovered: number;
    extracted: number;
    nonUsPassed: number;
    fundingQualified: number;
    founderFound: number;
    emailVerified: number;
    finalRanked: number;
    durationMs: number;
  };
}

export interface ProgressStage {
  stage: string;
  message: string;
  completed: boolean;
  current: number;
  total: number;
}

export interface PipelineStreamEvent {
  type: 'log' | 'progress' | 'candidate_found' | 'company_qualified' | 'complete' | 'error';
  timestamp: string;
  message: string;
  stage?: number;
  stageName?: string;
  stats?: RunAgentResult['stats'];
  company?: CompanyRecord;
  result?: RunAgentResult;
  error?: string;
}

export interface RunHistoryItem {
  id: string;
  timestamp: string;
  requestedCount: number;
  discoveredCount: number;
  extractedCount: number;
  qualifiedCount: number;
  rejectedCount: number;
  verifiedEmailsCount: number;
  durationSeconds: number;
  status: 'Completed' | 'Degraded' | 'Failed';
  sector: string;
  companies: CompanyRecord[];
}

export interface SettingsConfig {
  agent: {
    targetLeadsCount: number;
    minFunding: number;
    maxFunding: number;
    techPlatformRequired: boolean;
    usPresenceStrictness: 'strict_non_us' | 'allow_low_us_presence';
    minConfidenceThreshold: number;
    maxResearchCandidates: number;
    searchDepth: 'fast' | 'standard' | 'deep';
    deduplicationEnabled: boolean;
  };
  sources: {
    verifiedRegistry: boolean;
    rssFundingWires: boolean;
    openWebSearch: boolean;
    serpApi: boolean;
  };
  output: {
    defaultExportFormat: 'CSV' | 'PDF' | 'DOCX';
    includeEvidence: boolean;
    includeRejectedLeads: boolean;
    includeTimestamp: boolean;
  };
  appearance: {
    paperTexture: boolean;
    sketchDecorations: boolean;
    tableDensity: 'comfortable' | 'compact';
    animations: boolean;
  };
}

export interface SystemHealthResult {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded';
  services: Record<string, {
    status: 'connected' | 'warning' | 'error';
    latencyMs: number;
    details: string;
  }>;
}

export const REQUIRED_FIELDS = [
  'name',
  'website',
  'description',
  'industry',
  'fundingOrRevenue',
  'usPresence',
  'founderOrCeoName',
  'founderOrCeoEmail',
] as const;

export type RequiredField = (typeof REQUIRED_FIELDS)[number];