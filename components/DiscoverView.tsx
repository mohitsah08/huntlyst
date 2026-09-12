'use client';

import { useState } from 'react';
import { SettingsConfig } from '@/lib/types';

interface DiscoverViewProps {
  config: SettingsConfig;
  isRunning: boolean;
  currentStep: number;
  currentMessage: string;
  logs: { time: string; text: string; stage?: string }[];
  candidatesFound: number;
  qualifiedCount: number;
  onStartHunt: (params: {
    targetLeads: number;
    sectors: string[];
    depth: 'fast' | 'standard' | 'deep';
  }) => void;
  onViewResults: () => void;
}

const AVAILABLE_SECTORS = [
  'All sectors',
  'AI & Machine Learning',
  'Fintech & Payments',
  'Developer Infrastructure',
  'Climate & CleanTech',
  'HealthTech & Bio',
  'B2B SaaS & Automation',
  'Cybersecurity & Privacy',
];

const HUNT_STAGES = [
  { id: 1, name: 'Discovering', desc: 'Scan EU/Asian venture sources' },
  { id: 2, name: 'Researching', desc: 'Fetch pages & parse intelligence' },
  { id: 3, name: 'Validating', desc: 'Verify $1M-$5M & non-US operations' },
  { id: 4, name: 'Finding founders', desc: 'Identify CEO / Co-founder identity' },
  { id: 5, name: 'Verifying contacts', desc: 'Resolve DNS MX mail servers' },
  { id: 6, name: 'Qualifying', desc: 'Score & finalize qualified shortlist' },
];

export default function DiscoverView({
  config,
  isRunning,
  currentStep,
  currentMessage,
  logs,
  candidatesFound,
  qualifiedCount,
  onStartHunt,
  onViewResults,
}: DiscoverViewProps) {
  const [targetLeads, setTargetLeads] = useState(config.agent.targetLeadsCount || 15);
  const [selectedSector, setSelectedSector] = useState<string>('All sectors');
  const [geography, setGeography] = useState<string>('Non-US');
  const [verificationStrictness, setVerificationStrictness] = useState<string>('Strict');
  const [depth, setDepth] = useState<'fast' | 'standard' | 'deep'>(
    config.agent.searchDepth || 'standard'
  );

  const handleIncrement = () => {
    if (targetLeads < 50) setTargetLeads((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (targetLeads > 5) setTargetLeads((prev) => prev - 1);
  };

  const handleLaunch = () => {
    onStartHunt({
      targetLeads,
      sectors: [selectedSector],
      depth,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Configuration Header Card */}
      <div className="paper-card bg-[#FFFDF9] rounded-2xl p-6 sm:p-7 relative shadow-sketch-sm border-2 border-[#1E1B18]">
        <div className="tape-strip" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎯</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B18]">
                Start a new hunt
              </h1>
            </div>
            <p className="text-xs font-mono text-[#766E65] mt-1">
              Autonomous company discovery, deep web research, and target qualification.
            </p>
          </div>

          {!isRunning && qualifiedCount > 0 && (
            <button
              type="button"
              onClick={onViewResults}
              className="sketch-btn px-4 py-2 text-xs font-bold text-[#1E1B18] bg-[#FAF6EE] hover:bg-[#FFE7DC] rounded-xl border-2 border-[#1E1B18] shadow-sketch-sm flex items-center gap-2 self-start sm:self-auto"
            >
              <span>📋</span> View Latest Results ({qualifiedCount}) →
            </button>
          )}
        </div>

        {/* Live Status or Config Form */}
        {isRunning ? (
          <div className="mt-6 pt-6 border-t border-[#F0EAD8] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#FF6B35] animate-ping" />
                <h3 className="font-display text-xl font-bold text-[#1E1B18]">
                  Hunt in progress...
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#FF6B35]">
                Stage {currentStep} of 6
              </span>
            </div>

            {/* Stages Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {HUNT_STAGES.map((s) => {
                const isCurrent = currentStep === s.id;
                const isPassed = currentStep > s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border-[1.5px] transition-all text-center ${
                      isCurrent
                        ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-sm'
                        : isPassed
                        ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32]'
                        : 'bg-[#FAF6EE] border-[#EBE4D5] text-[#8C847A]'
                    }`}
                  >
                    <div className="flex items-center justify-center font-bold text-xs font-mono mb-1">
                      {isPassed ? '✓' : `0${s.id}`}
                    </div>
                    <div className="font-bold text-xs">{s.name}</div>
                    <div className="text-[10px] text-[#766E65] leading-tight mt-0.5 hidden sm:block">
                      {s.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current telemetry message */}
            <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#EBE4D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">⚡</span>
                <span className="font-mono text-xs text-[#1E1B18] font-bold">
                  {currentMessage || 'Scanning candidate sources and seed indexes...'}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-[#766E65]">
                <span>Candidates: <strong>{candidatesFound}</strong></span>
                <span>Qualified: <strong className="text-[#FF6B35]">{qualifiedCount}</strong></span>
              </div>
            </div>

            {/* Streaming Logs Terminal */}
            <div className="bg-[#1E1B18] text-[#FAF6EE] p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto border-2 border-[#1E1B18]">
              <div className="text-[10px] uppercase tracking-wider text-[#FF6B35] font-bold pb-1 border-b border-[#3E3832] flex items-center justify-between">
                <span>Autonomous Telemetry Stream</span>
                <span>Live Feed</span>
              </div>
              {logs.length === 0 ? (
                <div className="text-[#8C847A] py-2">Waiting for first telemetry event...</div>
              ) : (
                logs.slice(-15).map((l, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-[#8C847A] shrink-0 text-[10px]">{l.time}</span>
                    <span className="text-[#FF6B35]">›</span>
                    <span className="text-[#E0DACB]">{l.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-[#F0EAD8] grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Hunt Controls (Section 9) */}
            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Target Leads Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Target leads
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="w-10 h-10 rounded-xl border-[1.8px] border-[#1E1B18] bg-white hover:bg-[#FAF6EE] font-bold text-base shadow-sketch-sm transition-all"
                    >
                      -
                    </button>
                    <div className="flex-1 h-10 rounded-xl border-[1.8px] border-[#1E1B18] bg-white flex items-center justify-center font-display text-xl font-bold text-[#1E1B18] shadow-sketch-inner">
                      {targetLeads} leads
                    </div>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="w-10 h-10 rounded-xl border-[1.8px] border-[#1E1B18] bg-white hover:bg-[#FAF6EE] font-bold text-base shadow-sketch-sm transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2. Focus Sector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Focus sector
                  </label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border-[1.8px] border-[#1E1B18] bg-white font-sans text-xs font-bold text-[#1E1B18] shadow-sketch-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  >
                    {AVAILABLE_SECTORS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Geography */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Geography
                  </label>
                  <select
                    value={geography}
                    onChange={(e) => setGeography(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border-[1.8px] border-[#1E1B18] bg-white font-sans text-xs font-bold text-[#1E1B18] shadow-sketch-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  >
                    <option value="Non-US">Non-US (Minimal / No US Presence)</option>
                    <option value="Europe & UK">Europe & UK Tech Hubs</option>
                    <option value="Asia-Pacific">Asia-Pacific (Singapore, India, etc.)</option>
                    <option value="Latin America">Latin America</option>
                    <option value="Middle East">Middle East</option>
                  </select>
                </div>

                {/* 4. Funding / Revenue */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Funding / Revenue
                  </label>
                  <div className="h-10 px-3 rounded-xl border-[1.8px] border-[#1E1B18] bg-[#FAF6EE] flex items-center justify-between font-mono text-xs font-bold text-[#1E1B18]">
                    <span>$1,000,000</span>
                    <span className="text-[#8C847A]">—</span>
                    <span>$5,000,000</span>
                  </div>
                </div>

                {/* 5. Verification Strictness */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Verification
                  </label>
                  <select
                    value={verificationStrictness}
                    onChange={(e) => setVerificationStrictness(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border-[1.8px] border-[#1E1B18] bg-white font-sans text-xs font-bold text-[#1E1B18] shadow-sketch-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                  >
                    <option value="Strict">Strict (Full DNS MX & Founder Check)</option>
                    <option value="Standard">Standard (Executive & Domain Resolution)</option>
                  </select>
                </div>

                {/* 6. Discovery Depth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] block">
                    Discovery Depth
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fast', 'standard', 'deep'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDepth(d)}
                        className={`h-10 rounded-xl border-[1.5px] border-[#1E1B18] capitalize text-xs font-bold transition-all ${
                          depth === d
                            ? 'bg-[#FF6B35] text-white shadow-sketch-sm'
                            : 'bg-white text-[#1E1B18] hover:bg-[#FAF6EE]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Primary CTA (Section 8) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleLaunch}
                  className="w-full py-3.5 px-6 rounded-xl border-2 border-[#1E1B18] bg-[#FF6B35] hover:bg-[#F05820] text-white font-display text-lg font-bold shadow-sketch hover:shadow-sketch-hover transition-all flex items-center justify-center gap-2.5 group"
                >
                  <span className="text-base group-hover:scale-125 transition-transform">▶</span>
                  <span>Start a Hunt</span>
                </button>
                <p className="font-hand text-xs text-center text-[#5A544E] mt-2 tracking-wide">
                  ✎ &quot;Find something interesting.&quot;
                </p>
              </div>
            </div>

            {/* Right Column: "Your hunt" Compact Summary (Section 9) */}
            <div className="lg:col-span-4 bg-[#FAF6EE] p-5 rounded-xl border-2 border-[#1E1B18] shadow-sketch-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#EBE4D5] pb-2">
                  <span className="font-display font-bold text-lg text-[#1E1B18]">
                    Your hunt
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-[#FFE7DC] text-[#FF6B35] font-bold px-2 py-0.5 rounded">
                    Active Profile
                  </span>
                </div>

                <ul className="space-y-2 text-xs font-mono">
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Target:</span>
                    <span className="font-bold text-[#1E1B18]">{targetLeads} leads</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Category:</span>
                    <span className="font-bold text-[#1E1B18]">Technology platforms</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Funding:</span>
                    <span className="font-bold text-[#1E1B18]">$1M – $5M</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Geography:</span>
                    <span className="font-bold text-[#1E1B18]">Minimal / no US presence</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Leadership:</span>
                    <span className="font-bold text-[#1E1B18]">CEO / Co-founder</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#766E65]">Contact:</span>
                    <span className="font-bold text-[#2E7D32]">Verified DNS MX</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#EBE4D5] text-[11px] text-[#5A544E] leading-relaxed">
                <span className="font-bold text-[#1E1B18] block mb-0.5">Autonomous Guarantee:</span>
                Huntlyst will verify each candidate against all criteria gates before qualifying. Missing data stays missing.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
