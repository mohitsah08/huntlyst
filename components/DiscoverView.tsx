'use client';

import { useState } from 'react';
import { HuntConfig, SettingsConfig, TVB_EVALUATION_CONFIG } from '@/lib/types';
import HuntConfiguration from './HuntConfiguration';
import HuntLoadingScreen from './HuntLoadingScreen';

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
        <div className="space-y-6">
          <HuntLoadingScreen
            config={activeConfig}
            currentStep={currentStep}
            currentMessage={currentMessage}
            candidatesFound={candidatesFound}
            qualifiedCount={qualifiedCount}
            onViewResults={onViewResults}
          />

          {/* Streaming Logs Terminal */}
          <div className="bg-[#1E1B18] text-[#FAF6EE] p-5 rounded-2xl font-mono text-xs space-y-2 max-h-56 overflow-y-auto border-2 border-[#1E1B18] shadow-sketch max-w-4xl mx-auto">
            <div className="text-[10px] uppercase tracking-wider text-[#FF6B35] font-bold pb-2 border-b border-[#3E3832] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-ping" />
                Autonomous Telemetry Stream
              </span>
              <span className="text-[#8C847A]">Real-Time SSE</span>
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
