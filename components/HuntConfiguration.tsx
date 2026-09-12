'use client';

import { useState, useMemo, useEffect } from 'react';
import { HuntConfig, TVB_EVALUATION_CONFIG, SavedHuntPreset } from '@/lib/types';
import { COUNTRIES, REGION_PRESETS, searchCountries, CountryItem, findCountry } from '@/lib/geography';
import { parseNaturalLanguageHunt, ParsedHuntResult } from '@/lib/nlParser';

interface HuntConfigurationProps {
  initialConfig?: HuntConfig;
  isRunning: boolean;
  onLaunchHunt: (config: HuntConfig) => void;
}

const ALL_SECTORS = [
  'All sectors',
  'AI',
  'SaaS',
  'Cybersecurity',
  'Fintech',
  'HealthTech',
  'EdTech',
  'TravelTech',
  'Digital Twin',
  'Automation',
  'Developer Tools',
  'Cloud Infrastructure',
  'Enterprise Software',
  'ClimateTech',
  'PropTech',
  'InsurTech',
  'HRTech',
  'MarTech',
  'RetailTech',
  'LogisticsTech',
  'DeepTech',
  'Robotics',
  'Other Technology',
];

const BUSINESS_MODELS = [
  'B2B',
  'B2B2C',
  'B2C',
  'SaaS',
  'Marketplace',
  'Platform',
  'API',
  'Enterprise',
  'Subscription',
  'Other',
];

const STAGES = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
  'Scale-up',
  'Any',
];

const FUNDING_PRESETS = [
  { label: '$0–$1M', min: 0, max: 1_000_000 },
  { label: '$1M–$5M', min: 1_000_000, max: 5_000_000, isDefault: true },
  { label: '$5M–$10M', min: 5_000_000, max: 10_000_000 },
  { label: '$10M–$25M', min: 10_000_000, max: 25_000_000 },
  { label: '$25M+', min: 25_000_000, max: 100_000_000 },
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];

const BUILTIN_PRESETS: SavedHuntPreset[] = [
  {
    id: 'tvb_eval_default',
    name: 'TVB Evaluation Profile',
    description: 'Original assignment profile: $1M–$5M, Non-US, Tech Platform, CEO/Founder, Verified Email.',
    isDefault: true,
    createdAt: '2025-01-01',
    config: TVB_EVALUATION_CONFIG,
  },
  {
    id: 'preset_indian_ai',
    name: 'Indian AI Hunt',
    description: 'High-growth AI, Machine Learning, and LLM startups headquartered in India.',
    createdAt: '2025-01-02',
    config: {
      ...TVB_EVALUATION_CONFIG,
      id: 'preset_indian_ai',
      name: 'Indian AI Hunt',
      geography: {
        mode: 'countries',
        regions: [],
        countries: ['India'],
        excludedCountries: ['United States'],
        usPresence: 'minimal_or_none',
      },
      sectors: ['AI'],
      stage: ['Seed', 'Series A'],
      funding: { min: 1_000_000, max: 5_000_000, mode: 'funding_or_revenue', preset: '$1M–$5M' },
      targetLeads: 15,
    },
  },
  {
    id: 'preset_asian_fintech',
    name: 'Asian Fintech Hunt',
    description: 'Payments, banking API, and cross-border fintech across Singapore, India, and Indonesia.',
    createdAt: '2025-01-03',
    config: {
      ...TVB_EVALUATION_CONFIG,
      id: 'preset_asian_fintech',
      name: 'Asian Fintech Hunt',
      geography: {
        mode: 'regions',
        regions: ['Asia'],
        countries: ['Singapore', 'India', 'Indonesia'],
        excludedCountries: ['United States'],
        usPresence: 'minimal_or_none',
      },
      sectors: ['Fintech'],
      stage: ['Seed', 'Series A'],
      funding: { min: 1_000_000, max: 5_000_000, mode: 'funding_or_revenue', preset: '$1M–$5M' },
      targetLeads: 15,
    },
  },
  {
    id: 'preset_european_saas',
    name: 'European SaaS Hunt',
    description: 'B2B Enterprise software and developer tools across UK, Germany, France, and Nordics.',
    createdAt: '2025-01-04',
    config: {
      ...TVB_EVALUATION_CONFIG,
      id: 'preset_european_saas',
      name: 'European SaaS Hunt',
      geography: {
        mode: 'regions',
        regions: ['Europe'],
        countries: ['Germany', 'United Kingdom', 'France', 'Switzerland'],
        excludedCountries: ['United States'],
        usPresence: 'strictly_none',
      },
      sectors: ['SaaS', 'Enterprise Software'],
      stage: ['Seed', 'Series A'],
      funding: { min: 1_000_000, max: 5_000_000, mode: 'funding_or_revenue', preset: '$1M–$5M' },
      targetLeads: 15,
    },
  },
  {
    id: 'preset_global_cybersecurity',
    name: 'Global Cybersecurity Hunt',
    description: 'Cloud security, identity, and zero-trust platforms worldwide (excluding US headquarters).',
    createdAt: '2025-01-05',
    config: {
      ...TVB_EVALUATION_CONFIG,
      id: 'preset_global_cybersecurity',
      name: 'Global Cybersecurity Hunt',
      geography: {
        mode: 'global',
        regions: [],
        countries: [],
        excludedCountries: ['United States'],
        usPresence: 'minimal_or_none',
      },
      sectors: ['Cybersecurity'],
      stage: ['Seed', 'Series A'],
      funding: { min: 1_000_000, max: 5_000_000, mode: 'funding_or_revenue', preset: '$1M–$5M' },
      targetLeads: 15,
    },
  },
];

type TabId = 'where' | 'what' | 'profile' | 'contact' | 'depth' | 'advanced';

export default function HuntConfiguration({
  initialConfig = TVB_EVALUATION_CONFIG,
  isRunning,
  onLaunchHunt,
}: HuntConfigurationProps) {
  const [config, setConfig] = useState<HuntConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<TabId>('where');

  // Country Search State
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [excludeSearchQuery, setExcludeSearchQuery] = useState('');

  // Natural Language State
  const [nlInput, setNlInput] = useState('');
  const [nlResult, setNlResult] = useState<ParsedHuntResult | null>(null);

  // Saved Presets State
  const [savedPresets, setSavedPresets] = useState<SavedHuntPreset[]>(BUILTIN_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tvb_eval_default');

  // Load custom saved presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('huntlyst_saved_hunts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedPresets([...BUILTIN_PRESETS, ...parsed.filter((p: any) => !BUILTIN_PRESETS.some(b => b.id === p.id))]);
        }
      }
    } catch {}
  }, []);

  // Filtered countries for instant search
  const countrySearchResults = useMemo(() => {
    return searchCountries(countrySearchQuery).slice(0, 14);
  }, [countrySearchQuery]);

  const excludeSearchResults = useMemo(() => {
    return searchCountries(excludeSearchQuery).slice(0, 14);
  }, [excludeSearchQuery]);

  // Contradiction Detection
  const contradictionWarning = useMemo(() => {
    const included = new Set(config.geography.countries.map(c => c.toLowerCase()));
    for (const ex of config.geography.excludedCountries) {
      if (included.has(ex.toLowerCase())) {
        return `Your geography both includes and excludes "${ex}". Please resolve this conflict before starting.`;
      }
    }
    if (config.geography.countries.length === 0 && config.geography.regions.length === 0 && config.geography.mode !== 'global') {
      return 'Please specify at least one country, region, or select "Global".';
    }
    return null;
  }, [config.geography]);

  // Dynamic Search Strategy Narrative
  const searchStrategyText = useMemo(() => {
    const geoDesc = config.geography.countries.length > 0
      ? `headquartered in ${config.geography.countries.join(', ')}`
      : config.geography.regions.length > 0
      ? `across ${config.geography.regions.join(', ')}`
      : 'internationally (Global)';

    const sectorDesc = config.sectors.includes('all') || config.sectors.length === 0
      ? 'technology platform companies'
      : `${config.sectors.join(', ')} startups`;

    const fundingDesc = `$${(config.funding.min / 1_000_000).toFixed(1)}M–$${(config.funding.max / 1_000_000).toFixed(1)}M ${config.funding.mode.replace('_', ' ')}`;

    const usDesc = config.geography.usPresence === 'strictly_none'
      ? 'strictly zero US presence'
      : config.geography.usPresence === 'minimal_or_none'
      ? 'minimal or no US presence'
      : config.geography.usPresence === 'limited'
      ? 'allowing limited US customer presence'
      : 'any US presence';

    const contactDesc = config.contactRequirement === 'ceo_only'
      ? 'verified CEO'
      : config.contactRequirement === 'cofounder_only'
      ? 'verified Co-founder'
      : 'verifiable CEO or Co-founder';

    const emailDesc = config.emailVerification === 'required'
      ? 'with live DNS MX deliverable email'
      : 'with leadership email';

    return `Searching for ${sectorDesc} ${geoDesc}, with ${fundingDesc}, ${usDesc}, targeting ${contactDesc} ${emailDesc}. Candidate search depth set to ${config.depth.toUpperCase()} with a target of ${config.targetLeads} qualified companies.`;
  }, [config]);

  // Region Toggle
  const toggleRegion = (regionId: string) => {
    const preset = REGION_PRESETS.find(p => p.id === regionId);
    if (!preset) return;

    setConfig(prev => {
      const isAlreadySelected = prev.geography.regions.includes(preset.name);
      let nextRegions = isAlreadySelected
        ? prev.geography.regions.filter(r => r !== preset.name)
        : [...prev.geography.regions, preset.name];

      // Automatically populate countries when selecting a region preset
      let nextCountries = [...prev.geography.countries];
      if (!isAlreadySelected) {
        for (const c of preset.countryNames) {
          if (!nextCountries.includes(c)) nextCountries.push(c);
        }
      }

      return {
        ...prev,
        geography: {
          ...prev.geography,
          mode: nextRegions.length > 0 ? 'regions' : nextCountries.length > 0 ? 'countries' : 'global',
          regions: nextRegions,
          countries: nextCountries,
        },
      };
    });
  };

  // Country Toggle (Add/Remove)
  const toggleCountry = (countryName: string) => {
    setConfig(prev => {
      const exists = prev.geography.countries.includes(countryName);
      const nextCountries = exists
        ? prev.geography.countries.filter(c => c !== countryName)
        : [...prev.geography.countries, countryName];

      return {
        ...prev,
        geography: {
          ...prev.geography,
          mode: nextCountries.length > 0 ? 'countries' : 'global',
          countries: nextCountries,
        },
      };
    });
  };

  // Excluded Country Toggle
  const toggleExcludedCountry = (countryName: string) => {
    setConfig(prev => {
      const exists = prev.geography.excludedCountries.includes(countryName);
      const nextExcluded = exists
        ? prev.geography.excludedCountries.filter(c => c !== countryName)
        : [...prev.geography.excludedCountries, countryName];

      return {
        ...prev,
        geography: {
          ...prev.geography,
          excludedCountries: nextExcluded,
        },
      };
    });
  };

  // Sector Toggle
  const toggleSector = (sector: string) => {
    setConfig(prev => {
      if (sector === 'All sectors') {
        return { ...prev, sectors: ['all'] };
      }
      let current = prev.sectors.filter(s => s !== 'all');
      if (current.includes(sector)) {
        current = current.filter(s => s !== sector);
      } else {
        current.push(sector);
      }
      return { ...prev, sectors: current.length === 0 ? ['all'] : current };
    });
  };

  // Business Model Toggle
  const toggleBusinessModel = (model: string) => {
    setConfig(prev => {
      const exists = prev.businessModels.includes(model);
      const next = exists ? prev.businessModels.filter(m => m !== model) : [...prev.businessModels, model];
      return { ...prev, businessModels: next.length === 0 ? ['Platform'] : next };
    });
  };

  // Stage Toggle
  const toggleStage = (stage: string) => {
    setConfig(prev => {
      if (stage === 'Any') return { ...prev, stage: ['Any'] };
      let current = prev.stage.filter(s => s !== 'Any');
      if (current.includes(stage)) {
        current = current.filter(s => s !== stage);
      } else {
        current.push(stage);
      }
      return { ...prev, stage: current.length === 0 ? ['Any'] : current };
    });
  };

  // Handle Natural Language Parse
  const handleParseNl = () => {
    if (!nlInput.trim()) return;
    const parsed = parseNaturalLanguageHunt(nlInput);
    setNlResult(parsed);
  };

  const handleApplyNl = () => {
    if (nlResult) {
      setConfig(nlResult.config);
      setActiveTab('where');
    }
  };

  // Handle Preset Load
  const handleLoadPreset = (presetId: string) => {
    const preset = savedPresets.find(p => p.id === presetId);
    if (preset) {
      setConfig(preset.config);
      setSelectedPresetId(preset.id);
    }
  };

  // Handle Save Current Preset
  const handleSaveCurrentAsPreset = () => {
    const name = prompt('Enter a name for this custom hunt preset:', config.name || 'Custom Hunt');
    if (!name) return;

    const newPreset: SavedHuntPreset = {
      id: `custom_${Date.now()}`,
      name,
      description: `Custom search in ${config.geography.countries.join(', ') || 'Global'} with ${config.sectors.join(', ')}`,
      createdAt: new Date().toISOString().slice(0, 10),
      config: { ...config, name },
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    setSelectedPresetId(newPreset.id);

    // Persist custom ones to localStorage
    try {
      const customOnly = updated.filter(p => !p.isDefault && !BUILTIN_PRESETS.some(b => b.id === p.id));
      localStorage.setItem('huntlyst_saved_hunts', JSON.stringify(customOnly));
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Research Desk */}
      <div className="paper-card bg-[#FFFDF9] rounded-2xl p-6 sm:p-7 border-2 border-[#1E1B18] shadow-sketch-sm relative">
        <div className="tape-strip" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F0EAD8]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎯</span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1E1B18]">
                Customize Your Hunt
              </h1>
              {selectedPresetId === 'tvb_eval_default' && (
                <span className="badge-tag bg-[#FFE7DC] text-[#FF6B35] border border-[#FF6B35] text-[10px] font-bold px-2 py-0.5 rounded-md ml-2">
                  Assignment default
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#766E65] mt-1">
              Tell Huntlyst where and what to look for. Every parameter directly influences autonomous search and qualification.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#766E65]">Preset:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handleLoadPreset(e.target.value)}
              className="bg-[#FAF6EE] text-xs font-bold font-mono text-[#1E1B18] px-3 py-2 rounded-xl border-2 border-[#1E1B18] shadow-sketch-xs focus:outline-none focus:border-[#FF6B35]"
            >
              {savedPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSaveCurrentAsPreset}
              className="sketch-btn px-2.5 py-2 text-xs font-bold bg-[#FAF6EE] hover:bg-[#FFE7DC] text-[#1E1B18] rounded-xl border-2 border-[#1E1B18] shadow-sketch-xs"
              title="Save current configuration as a new preset"
            >
              💾 Save
            </button>
          </div>
        </div>

        {/* Tab Navigation (Interactive Research Desk) */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-[#F0EAD8] scrollbar-none">
          {[
            { id: 'where', label: '1. WHERE', icon: '📍', desc: 'Geography' },
            { id: 'what', label: '2. WHAT', icon: '🏢', desc: 'Sectors & Model' },
            { id: 'profile', label: '3. PROFILE', icon: '📊', desc: 'Stage & Funding' },
            { id: 'contact', label: '4. CONTACT', icon: '👤', desc: 'Founder & Verification' },
            { id: 'depth', label: '5. DEPTH', icon: '⚡', desc: 'Depth & Leads' },
            { id: 'advanced', label: '6. ADVANCED', icon: '✨', desc: 'Natural Language' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all whitespace-nowrap border-2 ${
                  isActive
                    ? 'bg-[#FF6B35] text-white border-[#1E1B18] shadow-sketch-xs'
                    : 'bg-[#FAF6EE] text-[#1E1B18] border-[#1E1B18]/30 hover:border-[#1E1B18]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WHERE (Geography) */}
        {activeTab === 'where' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                  Where should we hunt?
                </h3>
                <span className="handwritten text-sm text-[#FF6B35]">
                  Start broad or get specific ✍️
                </span>
              </div>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Select region presets or search for individual countries. Huntlyst will automatically target local venture registries and sources.
              </p>
            </div>

            {/* Region Presets Cards */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2">
                Region Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {REGION_PRESETS.filter(p => p.id !== 'global').map((preset) => {
                  const isSelected = config.geography.regions.includes(preset.name);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => toggleRegion(preset.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
                          : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      <div className="text-xl mb-1">{preset.icon}</div>
                      <div className="font-display text-xs font-bold text-[#1E1B18]">{preset.name}</div>
                      <div className="text-[10px] font-mono text-[#766E65] truncate mt-0.5">
                        {preset.countryNames.length} countries
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Country Multi-Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Include Countries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                    Target Countries (Include)
                  </label>
                  <span className="text-xs font-mono text-[#FF6B35]">
                    {config.geography.countries.length} selected
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    placeholder="Search country (e.g. India, Aus, South)..."
                    className="w-full bg-[#FAF6EE] text-xs font-mono text-[#1E1B18] px-3.5 py-2.5 rounded-xl border-2 border-[#1E1B18] focus:outline-none focus:border-[#FF6B35]"
                  />
                  {countrySearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCountrySearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-[#766E65]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Country Search Results */}
                <div className="max-h-36 overflow-y-auto border-2 border-[#1E1B18] rounded-xl p-2 bg-[#FAF6EE] space-y-1">
                  {countrySearchResults.map((c) => {
                    const isSelected = config.geography.countries.includes(c.name);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => toggleCountry(c.name)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-all ${
                          isSelected ? 'bg-[#FF6B35] text-white font-bold' : 'hover:bg-white text-[#1E1B18]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="text-[10px] opacity-75">{c.region}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Country Chips */}
                {config.geography.countries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.geography.countries.map((c) => {
                      const item = findCountry(c);
                      return (
                        <span
                          key={c}
                          className="badge-tag bg-[#FFE7DC] text-[#1E1B18] border border-[#FF6B35] text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5"
                        >
                          <span>{item?.flag || '🌐'}</span>
                          <span>{c}</span>
                          <button
                            type="button"
                            onClick={() => toggleCountry(c)}
                            className="hover:text-[#FF6B35] font-bold"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exclude Countries & US Presence */}
              <div className="space-y-4">
                {/* Exclude Geography */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                      Exclude Geography
                    </label>
                    <span className="text-xs font-mono text-[#D64045]">
                      {config.geography.excludedCountries.length} excluded
                    </span>
                  </div>

                  <input
                    type="text"
                    value={excludeSearchQuery}
                    onChange={(e) => setExcludeSearchQuery(e.target.value)}
                    placeholder="Exclude country (e.g. United States, China)..."
                    className="w-full bg-[#FAF6EE] text-xs font-mono text-[#1E1B18] px-3.5 py-2 rounded-xl border-2 border-[#1E1B18] focus:outline-none focus:border-[#D64045]"
                  />

                  {excludeSearchQuery && (
                    <div className="max-h-28 overflow-y-auto border-2 border-[#1E1B18] rounded-xl p-2 bg-[#FAF6EE] space-y-1">
                      {excludeSearchResults.map((c) => {
                        const isExcluded = config.geography.excludedCountries.includes(c.name);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => toggleExcludedCountry(c.name)}
                            className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-mono text-left transition-all ${
                              isExcluded ? 'bg-[#D64045] text-white font-bold' : 'hover:bg-white text-[#1E1B18]'
                            }`}
                          >
                            <span>{c.flag} {c.name}</span>
                            <span>{isExcluded ? 'Excluded' : '+ Exclude'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {config.geography.excludedCountries.map((c) => (
                      <span
                        key={c}
                        className="badge-tag bg-[#FFE8E8] text-[#D64045] border border-[#D64045] text-[11px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1.5"
                      >
                        <span>🚫 {c}</span>
                        <button
                          type="button"
                          onClick={() => toggleExcludedCountry(c)}
                          className="hover:text-[#1E1B18] font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* US Presence Selector */}
                <div className="pt-2 border-t border-[#F0EAD8]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                      US Presence Policy
                    </label>
                    {config.geography.usPresence === 'minimal_or_none' && (
                      <span className="text-[10px] font-bold text-[#FF6B35] font-mono">Assignment default</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'strictly_none', label: 'Strictly no US presence' },
                      { id: 'minimal_or_none', label: 'Minimal / None (Default)' },
                      { id: 'limited', label: 'Allow limited US presence' },
                      { id: 'any', label: 'Any US presence' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          geography: { ...prev.geography, usPresence: opt.id as any },
                        }))}
                        className={`p-2 rounded-xl text-xs font-mono text-left border-2 transition-all ${
                          config.geography.usPresence === opt.id
                            ? 'bg-[#FFE7DC] border-[#FF6B35] font-bold text-[#1E1B18]'
                            : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white text-[#766E65]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHAT (Sectors & Business Models) */}
        {activeTab === 'what' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                What should we hunt for?
              </h3>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Select industries, technology sectors, and operating business models.
              </p>
            </div>

            {/* Multi-Select Sectors */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Industry & Technology Sectors
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTORS.map((sector) => {
                  const isSelected = sector === 'All sectors'
                    ? config.sectors.includes('all')
                    : config.sectors.includes(sector);

                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => toggleSector(sector)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border-2 transition-all ${
                        isSelected
                          ? 'bg-[#FF6B35] text-white border-[#1E1B18] shadow-sketch-xs font-bold'
                          : 'bg-[#FAF6EE] text-[#1E1B18] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      {sector}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Models */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Target Business Models
              </label>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_MODELS.map((model) => {
                  const isSelected = config.businessModels.includes(model);
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => toggleBusinessModel(model)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border-2 transition-all ${
                        isSelected
                          ? 'bg-[#FFE7DC] text-[#1E1B18] border-[#FF6B35] font-bold shadow-sketch-xs'
                          : 'bg-[#FAF6EE] text-[#766E65] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      {model}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Technology Profile Strictness */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Technology Profile Requirement
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'platform_required', label: 'Platform required (Default)', desc: 'Must operate proprietary tech platform/SaaS' },
                  { id: 'ai_first', label: 'AI-First only', desc: 'Must leverage deep machine learning / LLMs' },
                  { id: 'software_only', label: 'Software / SaaS only', desc: 'Pure software applications and cloud services' },
                  { id: 'tech_enabled', label: 'Tech-enabled business', desc: 'Includes tech-driven marketplaces & services' },
                  { id: 'any_tech', label: 'Any technology company', desc: 'Broad technology companies' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, techProfile: p.id as any }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      config.techProfile === p.id
                        ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
                        : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white'
                    }`}
                  >
                    <div className="font-display text-xs font-bold text-[#1E1B18]">{p.label}</div>
                    <div className="text-[10px] font-mono text-[#766E65] mt-0.5">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE (Stage, Funding & Size) */}
        {activeTab === 'profile' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                Company Stage, Funding & Size
              </h3>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Configure capital thresholds and target development milestones.
              </p>
            </div>

            {/* Funding Range Presets & Mode */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                  Funding / Revenue Range
                </label>
                <div className="flex items-center gap-1">
                  {(['funding_or_revenue', 'funding', 'revenue'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        funding: { ...prev.funding, mode },
                      }))}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                        config.funding.mode === mode
                          ? 'bg-[#FF6B35] text-white border-[#1E1B18] font-bold'
                          : 'bg-[#FAF6EE] text-[#766E65] border-[#1E1B18]/30'
                      }`}
                    >
                      {mode.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {FUNDING_PRESETS.map((p) => {
                  const isSelected = config.funding.min === p.min && config.funding.max === p.max;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setConfig(prev => ({
                        ...prev,
                        funding: { ...prev.funding, min: p.min, max: p.max, preset: p.label },
                      }))}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        isSelected
                          ? 'bg-[#FF6B35] text-white border-[#1E1B18] shadow-sketch-xs font-bold'
                          : 'bg-[#FAF6EE] text-[#1E1B18] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      <div className="font-display text-xs">{p.label}</div>
                      {p.isDefault && <div className="text-[9px] opacity-80">Assignment</div>}
                    </button>
                  );
                })}
              </div>

              {/* Custom Min / Max Inputs */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF6EE] p-3 rounded-xl border-2 border-[#1E1B18]">
                <div>
                  <label className="block text-[10px] font-mono text-[#766E65] uppercase mb-1">
                    Minimum USD ($)
                  </label>
                  <input
                    type="number"
                    value={config.funding.min}
                    step={500000}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      funding: { ...prev.funding, min: Number(e.target.value), preset: 'Custom' },
                    }))}
                    className="w-full bg-white text-xs font-mono font-bold text-[#1E1B18] px-3 py-2 rounded-lg border border-[#1E1B18]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#766E65] uppercase mb-1">
                    Maximum USD ($)
                  </label>
                  <input
                    type="number"
                    value={config.funding.max}
                    step={500000}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      funding: { ...prev.funding, max: Number(e.target.value), preset: 'Custom' },
                    }))}
                    className="w-full bg-white text-xs font-mono font-bold text-[#1E1B18] px-3 py-2 rounded-lg border border-[#1E1B18]"
                  />
                </div>
              </div>
            </div>

            {/* Company Stage */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Target Company Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((st) => {
                  const isSelected = config.stage.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleStage(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border-2 transition-all ${
                        isSelected
                          ? 'bg-[#FFE7DC] text-[#1E1B18] border-[#FF6B35] font-bold shadow-sketch-xs'
                          : 'bg-[#FAF6EE] text-[#766E65] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Company Size */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                  Company Size (Employees)
                </label>
                <span className="text-[10px] font-mono text-[#766E65]">Optional (soft filter)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMPANY_SIZES.map((sz) => {
                  const isSelected = (config.companySize || []).includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setConfig(prev => {
                        const current = prev.companySize || [];
                        const next = current.includes(sz) ? current.filter(s => s !== sz) : [...current, sz];
                        return { ...prev, companySize: next };
                      })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border-2 transition-all ${
                        isSelected
                          ? 'bg-[#FFE7DC] text-[#1E1B18] border-[#FF6B35] font-bold shadow-sketch-xs'
                          : 'bg-[#FAF6EE] text-[#766E65] border-[#1E1B18] hover:bg-white'
                      }`}
                    >
                      {sz} people
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTACT (Founder & Verification) */}
        {activeTab === 'contact' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                Leadership & Contact Verification
              </h3>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Enforce verifiable executive leadership and live mail server deliverability.
              </p>
            </div>

            {/* Founder Role */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Required Leadership Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ceo_or_cofounder', label: 'CEO or Co-founder', desc: 'Assignment default' },
                  { id: 'ceo_only', label: 'CEO required', desc: 'Chief Executive' },
                  { id: 'cofounder_only', label: 'Co-founder required', desc: 'Founding member' },
                  { id: 'any_executive', label: 'Any executive', desc: 'CTO, COO, VP' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, contactRequirement: opt.id as any }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      config.contactRequirement === opt.id
                        ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
                        : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white'
                    }`}
                  >
                    <div className="font-display text-xs font-bold text-[#1E1B18]">{opt.label}</div>
                    <div className="text-[10px] font-mono text-[#766E65] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Verification Level */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Contact Verification Strictness
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'required', label: 'Verified email required', desc: 'Candidate rejected if MX lookup fails (Default)' },
                  { id: 'preferred', label: 'Professional email preferred', desc: 'Prioritize verified emails, keep unverified' },
                  { id: 'none', label: 'Email not required', desc: 'Discover companies without contact constraint' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, emailVerification: opt.id as any }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      config.emailVerification === opt.id
                        ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
                        : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white'
                    }`}
                  >
                    <div className="font-display text-xs font-bold text-[#1E1B18]">{opt.label}</div>
                    <div className="text-[10px] font-mono text-[#766E65] mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DEPTH (Search Depth & Target Leads) */}
        {activeTab === 'depth' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                Search Depth & Target Leads
              </h3>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Control the speed, breath of candidate discovery, and target quota.
              </p>
            </div>

            {/* Depth Options */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider mb-2.5">
                Discovery Depth Strategy
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'quick', label: 'Quick', desc: 'Faster, 1 round, fewer queries' },
                  { id: 'balanced', label: 'Balanced', desc: 'Recommended, multi-round discovery' },
                  { id: 'deep', label: 'Deep', desc: 'Deep research across 10+ query variants' },
                  { id: 'exhaustive', label: 'Exhaustive', desc: 'Maximum depth across all registries' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, depth: d.id as any }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      config.depth === d.id
                        ? 'bg-[#FFE7DC] border-[#FF6B35] shadow-sketch-xs'
                        : 'bg-[#FAF6EE] border-[#1E1B18] hover:bg-white'
                    }`}
                  >
                    <div className="font-display text-xs font-bold text-[#1E1B18]">{d.label}</div>
                    <div className="text-[10px] font-mono text-[#766E65] mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Leads Stepper */}
            <div className="pt-4 border-t border-[#F0EAD8]">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-mono font-bold text-[#1E1B18] uppercase tracking-wider">
                  Target Qualified Leads
                </label>
                <span className="font-mono text-xs font-bold text-[#FF6B35]">
                  Target: {config.targetLeads} qualified companies
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#FAF6EE] px-3 py-1.5 rounded-xl border-2 border-[#1E1B18]">
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetLeads: Math.max(5, prev.targetLeads - 5) }))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#1E1B18] text-sm font-bold hover:bg-[#FFE7DC]"
                  >
                    -
                  </button>
                  <span className="font-display text-xl font-bold px-3 min-w-[2.5rem] text-center">
                    {config.targetLeads}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, targetLeads: Math.min(100, prev.targetLeads + 5) }))}
                    className="w-8 h-8 rounded-lg bg-white border border-[#1E1B18] text-sm font-bold hover:bg-[#FFE7DC]"
                  >
                    +
                  </button>
                </div>

                {/* Preset Pills */}
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, targetLeads: num }))}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                        config.targetLeads === num
                          ? 'bg-[#FF6B35] text-white border-[#1E1B18] font-bold'
                          : 'bg-[#FAF6EE] text-[#1E1B18] border-[#1E1B18]/30 hover:border-[#1E1B18]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ADVANCED (Natural Language Hunt) */}
        {activeTab === 'advanced' && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1E1B18]">
                Natural Language Hunt
              </h3>
              <p className="text-xs font-mono text-[#766E65] mt-1">
                Describe your target criteria in plain English. Huntlyst will parse it into structured configuration filters.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="e.g. Find Indian AI startups with $1M–$5M funding and no significant US presence."
                rows={3}
                className="w-full bg-[#FAF6EE] text-xs font-mono text-[#1E1B18] p-3.5 rounded-xl border-2 border-[#1E1B18] focus:outline-none focus:border-[#FF6B35]"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleParseNl}
                  className="sketch-btn px-4 py-2 text-xs font-bold bg-[#FAF6EE] hover:bg-[#FFE7DC] text-[#1E1B18] rounded-xl border-2 border-[#1E1B18] shadow-sketch-xs"
                >
                  ⚡ Parse Hunt Parameters
                </button>

                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#766E65]">
                  <span>Examples:</span>
                  <button
                    type="button"
                    onClick={() => setNlInput('Find fintech companies in Singapore and India with 20-200 employees.')}
                    className="underline hover:text-[#FF6B35]"
                  >
                    Singapore & India Fintech
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setNlInput('Find Australian cybersecurity SaaS with $1M-$5M funding.')}
                    className="underline hover:text-[#FF6B35]"
                  >
                    Australian Cyber
                  </button>
                </div>
              </div>

              {/* Parsed Result Preview Card */}
              {nlResult && (
                <div className="paper-card bg-white p-4 rounded-xl border-2 border-[#1E1B18] shadow-sketch-xs mt-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0EAD8] pb-2">
                    <span className="font-display text-xs font-bold text-[#1E1B18]">
                      Parsed Search Parameters
                    </span>
                    <span className="text-[10px] font-mono text-[#2D5A27] font-bold">
                      Confidence: {(nlResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[#766E65] block text-[10px]">Countries:</span>
                      <span className="font-bold text-[#1E1B18]">
                        {nlResult.detectedSummary.countries.join(', ') || 'Global'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#766E65] block text-[10px]">Sectors:</span>
                      <span className="font-bold text-[#1E1B18]">
                        {nlResult.detectedSummary.sectors.join(', ') || 'All Tech'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#766E65] block text-[10px]">Funding:</span>
                      <span className="font-bold text-[#1E1B18]">
                        {nlResult.detectedSummary.fundingText || '$1M–$5M'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#766E65] block text-[10px]">US Presence:</span>
                      <span className="font-bold text-[#1E1B18]">
                        {nlResult.detectedSummary.usPresence}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleApplyNl}
                      className="sketch-btn px-3 py-1.5 text-xs font-bold bg-[#FF6B35] text-white rounded-lg border-2 border-[#1E1B18] shadow-sketch-xs"
                    >
                      ✓ Apply to Hunt Configuration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: Search Strategy Preview & Launch */}
        <div className="pt-6 border-t-2 border-[#1E1B18] mt-4 space-y-4">
          {/* Paper Card: Your Hunt */}
          <div className="paper-card bg-[#FAF6EE] p-4 sm:p-5 rounded-xl border-2 border-[#1E1B18] shadow-sketch-xs relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAD8] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="font-display text-sm font-bold text-[#1E1B18]">
                  Your Hunt Strategy
                </span>
              </div>
              <span className="font-mono text-xs text-[#766E65]">
                {config.geography.countries.length > 0 ? `${config.geography.countries.length} countries` : 'Global Non-US'} • {config.sectors.join(', ')} • {config.funding.preset || '$1M–$5M'}
              </span>
            </div>

            <p className="text-xs font-mono text-[#1E1B18] leading-relaxed pt-3">
              {searchStrategyText}
            </p>
          </div>

          {/* Contradiction Warning (if any) */}
          {contradictionWarning && (
            <div className="bg-[#FFE8E8] border-2 border-[#D64045] p-3.5 rounded-xl text-xs font-mono text-[#D64045] flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{contradictionWarning}</span>
            </div>
          )}

          {/* Launch Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#766E65]">
                Ready to dispatch autonomous discovery pipeline:
              </span>
            </div>

            <button
              type="button"
              disabled={isRunning || !!contradictionWarning}
              onClick={() => onLaunchHunt(config)}
              className={`sketch-btn px-6 py-3 rounded-xl font-display text-sm sm:text-base font-bold flex items-center justify-center gap-2 border-2 border-[#1E1B18] transition-all ${
                isRunning || !!contradictionWarning
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed border-gray-400'
                  : 'bg-[#FF6B35] hover:bg-[#e85a27] text-white shadow-sketch'
              }`}
            >
              <span>🚀</span>
              <span>{isRunning ? 'Hunting in progress...' : 'Start Hunt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
