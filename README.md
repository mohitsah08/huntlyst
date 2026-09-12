# HUNTLYST

> **"Find the companies worth knowing."**  
> *Autonomous company discovery, research, and lead intelligence platform.*

---

## Overview

**Huntlyst** is an autonomous intelligence pipeline designed to discover, research, qualify, and score high-conviction companies and executive contacts matching exact investment or partnership mandates.

Unlike conventional scraped databases that suffer from stale listings, hallucinated emails, or generic bulk lists, Huntlyst operates on a foundational rule:

> **Missing data is always better than invented data.**  
> Every lead must possess concrete web evidence, deterministic validation passes, and live DNS MX record verification. If a required field cannot be verified, the candidate is discarded.

---

## Core Target Profile Mandate

A company qualifies **only if all** of the following criteria are validated:

1. **Funding / Revenue**: Between **$1,000,000 and $5,000,000 USD** (inclusive).
2. **Tech Platform**: Operates a verified technology product, SaaS, marketplace, API, developer tool, or tech-enabled software platform.
3. **Non-US Geography**: Headquartered and operating primarily outside the United States (Europe, UK, APAC, LATAM, Canada, etc.).
4. **Verified Leadership Contact**: A verifiable Founder, CEO, or Co-Founder with an active professional email address verified via DNS MX records.

---

## Key Features

- **Autonomous Discovery & Web Extraction**: Multi-query SerpAPI discovery and web directory ingestion, followed by clean HTML parsing (Cheerio) and structured entity extraction via Anthropic Claude.
- **Deterministic Validation Engine**: Programmatic rule enforcement with zero LLM self-grading or prompt drift.
- **Live DNS MX Email Verification**: Generates RFC-compliant email candidate permutations and performs direct DNS MX lookups (`dns.promises.resolveMx`) to verify mail server routability.
- **Evidence-Based Hunt Score (0–100)**: Transparent 5-part scoring model (Funding Fit 20 pts, Tech Platform Fit 20 pts, Non-US Geo Fit 20 pts, Verified Founder 20 pts, Deliverable Contact 20 pts).
- **Multi-Format Intelligence Dossiers**: One-click exports to CSV, formatted Executive Summary PDF (`jspdf` + `jspdf-autotable`), and structured Word documents (`docx`).
- **Live Streaming Telemetry**: Server-Sent Events (`/api/run-agent?stream=true`) streaming candidate discovery, extraction, qualification verdicts, and logs directly to the interface.
- **Local Persistence & Saved Leads**: Browser-persisted hunt history and shortlisted leads with quick filtering and batch operations.

---

## Architecture & Pipeline Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Discovery    │ ──▶ │ 2. Extraction   │ ──▶ │ 3. Validation   │ ──▶ │ 4. MX Verify    │ ──▶ │ 5. Hunt Score   │
│    Engine       │     │    Module       │     │    Rules        │     │    Engine       │     │    & Dossier    │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │                       │                       │
         ▼                       ▼                       ▼                       ▼                       ▼
  • SerpAPI Queries       • Clean DOM text        • Deterministic         • Pattern Permutations • 0–100 Weighted
  • Directory sources     • Structured JSON         $1M–$5M check         • Live DNS MX record     Hunt Score
  • Root-domain dedup     • Anthropic Claude      • 50+ Tech keywords       verification         • CSV, PDF, DOCX
                            Sonnet extraction     • Non-US confirmation   • Zero unverified        exports
                                                    filters                 deliveries
```

### Module Breakdown

- [`lib/discovery.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/discovery.ts): Orchestrates search queries across Google search engines, tech directories, and funding announcements.
- [`lib/extraction.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/extraction.ts): Fetches source pages, strips scripts/ads/navigation, and extracts structured intelligence through Claude Sonnet.
- [`lib/validation.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/validation.ts): Hard programmatic boundary checks for funding brackets, technology classification, and non-US headquarters.
- [`lib/email.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/email.ts): Permutates canonical leadership email patterns and executes real-time MX record DNS lookups.
- [`lib/rank.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/rank.ts): Computes the 5-dimension Hunt Score and performs deduplication.
- [`lib/export.ts`](file:///Users/onlymec/tvb-company-discovery-agent/lib/export.ts): Generates branded CSV, PDF, and DOCX intelligence dossiers.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS with custom editorial hand-drawn warmth and typography (`Outfit`, `Caveat`, `JetBrains Mono`)
- **AI / LLM**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Search & Discovery**: SerpAPI
- **Document Generation**: `jspdf`, `jspdf-autotable`, `docx`
- **Testing & Verification**: Playwright MCP for end-to-end browser and mobile testing

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 18.17+ or Node 20+
- SerpAPI API Key
- Anthropic API Key

### 2. Installation

```bash
git clone https://github.com/onlymec/huntlyst.git
cd huntlyst
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Required for autonomous discovery
SERPAPI_KEY=your_serpapi_key_here

# Required for structured research extraction
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Abstract API for secondary mailbox verification
ABSTRACT_API_KEY=your_abstract_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view Huntlyst.

---

## Production Deployment

### Deploying to Vercel

```bash
npx vercel
```

Make sure to configure the production environment variables in the Vercel Dashboard:
- `SERPAPI_KEY`
- `ANTHROPIC_API_KEY`

---

## License

MIT © Huntlyst. All rights reserved.