'use client';

import { useState } from 'react';
import { HuntConfig, SettingsConfig, TVB_EVALUATION_CONFIG } from '@/lib/types';
import HuntConfiguration from './HuntConfiguration';

interface DiscoverViewProps {
  config: SettingsConfig;
  isRunning: boolean;
  currentStep: number;
  currentMessage: string;
  logs: { time: string; text: string; stage?: string }[];
  candidatesFound: number;
  qualifiedCount: number;
  onStartHunt: (huntConfig: HuntConfig) => void;
  onViewResults: () => void;
}

const HUNT_STAGES = [
  { id: 1, name: 'Discovering', desc: 'Scan targeted venture sources' },
  { id: 2, name: 'Researching', desc: 'Fetch pages & parse intelligence' },
  { id: 3, name: 'Validating', desc: 'Deterministic filter & rule checks' },
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
  const [activeConfig, setActiveConfig] = useState<HuntConfig>(TVB_EVALUATION_CONFIG);

  const handleLaunch = (selectedConfig: HuntConfig) => {
    setActiveConfig(selectedConfig);
    onStartHunt(selectedConfig);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {isRunning ? (
        /* Live Telemetry Progress Card */
        <div className="paper-card bg-[#FFFDF9] rounded-2xl p-6 sm:p-7 relative shadow-sketch-sm border-2 border-[#1E1B18] space-y-6">
          <div className="tape-strip" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EAD8]">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#FF6B35] animate-ping" />
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1E1B18]">
                  Autonomous Hunt in Progress
                </h2>
                <p className="text-xs font-mono text-[#766E65]">
                  Target: {activeConfig.geography.countries.join(', ') || activeConfig.geography.regions.join(', ') || 'Global Non-US'} • {activeConfig.sectors.join(', ')} • {activeConfig.targetLeads} leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-[#FF6B35] bg-[#FFE7DC] px-3 py-1.5 rounded-xl border border-[#FF6B35]">
                Stage {currentStep} of 6
              </span>
              {qualifiedCount > 0 && (
                <button
                  type="button"
                  onClick={onViewResults}
                  className="sketch-btn px-3 py-1.5 text-xs font-bold text-[#1E1B18] bg-[#FAF6EE] hover:bg-[#FFE7DC] rounded-xl border-2 border-[#1E1B18]"
                >
                  View Leads ({qualifiedCount}) →
                </button>
              )}
            </div>
          </div>

          {/* 6-Stage Progress Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {HUNT_STAGES.map((s) => {
              const isCurrent = currentStep === s.id;
              const isPassed = currentStep > s.id;
              return (
                <div
                  key={s.id}
                  className={`p-2.5 rounded-xl border-[1.5px] transition-all text-center ${
                    isCurrent
                      ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
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

          {/* Current telemetry message & metrics */}
          <div className="p-4 bg-[#FAF6EE] rounded-xl border-2 border-[#1E1B18] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sketch-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <span className="font-mono text-xs text-[#1E1B18] font-bold">
                {currentMessage || 'Scanning candidate sources and seed indexes...'}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs text-[#766E65]">
              <span>Candidates: <strong className="text-[#1E1B18]">{candidatesFound}</strong></span>
              <span>Qualified: <strong className="text-[#FF6B35]">{qualifiedCount}</strong></span>
            </div>
          </div>

          {/* Streaming Logs Terminal */}
          <div className="bg-[#1E1B18] text-[#FAF6EE] p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto border-2 border-[#1E1B18]">
            <div className="text-[10px] uppercase tracking-wider text-[#FF6B35] font-bold pb-1.5 border-b border-[#3E3832] flex items-center justify-between">
              <span>Autonomous Telemetry Stream</span>
              <span>Live Stream</span>
            </div>
            {logs.length === 0 ? (
              <div className="text-[#8C847A] py-2">Waiting for first telemetry event...</div>
            ) : (
              logs.slice(-20).map((l, i) => (
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
        /* Interactive Hunt Configuration Desk */
        <HuntConfiguration
          initialConfig={activeConfig}
          isRunning={isRunning}
          onLaunchHunt={handleLaunch}
        />
      )}
    </div>
  );
}
