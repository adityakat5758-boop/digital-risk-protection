'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { getApps, getBrand, getMessages, getProfiles } from '@/data/provider';
import { scoreProfile } from '@/lib/riskEngine';
import { checkApp } from '@/lib/appChecker';
import { analyzeText } from '@/lib/scamAnalyzer';

const Ctx = createContext(null);

function buildData(brandName) {
  const brand = getBrand(brandName);
  if (!brand) return null;
  const profiles = getProfiles(brandName)
    .map((p) => ({ ...p, risk: scoreProfile(p, brand) }))
    .sort((a, b) => b.risk.score - a.risk.score);
  const messages = getMessages(brandName).map((m) => ({ ...m, analysis: analyzeText(m.text, brand) }));
  const apps = getApps(brandName)
    .map((a) => ({ ...a, check: checkApp(a, brand) }))
    .sort((a, b) => b.check.score - a.check.score);
  return { brand, profiles, messages, apps };
}

export function AppProvider({ children }) {
  const [brandName, setBrandName] = useState(null);
  const [status, setStatus] = useState('idle');
  const [view, setView] = useState('dashboard');
  const [reported, setReported] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [analyzedCount, setAnalyzedCount] = useState(0);

  const data = useMemo(() => (brandName ? buildData(brandName) : null), [brandName]);

  const value = {
    data, status, view, reported, selectedId, analyzedCount,
    setView,
    startScan: (name) => { setBrandName(name); setStatus('scanning'); },
    finishScan: () => { setStatus('ready'); setView('dashboard'); },
    openProfile: setSelectedId,
    closeProfile: () => setSelectedId(null),
    markReported: (id) => setReported((r) => ({ ...r, [id]: true })),
    recordAnalysis: () => setAnalyzedCount((c) => c + 1),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
