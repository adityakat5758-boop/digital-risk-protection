'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApps, getBrand, getMessages, getProfiles } from '@/data/provider';
import { scoreProfile } from '@/lib/riskEngine';
import { checkApp } from '@/lib/appChecker';
import { analyzeText } from '@/lib/scamAnalyzer';

const Ctx = createContext(null);

// Adds a history entry (skipped when the URL would not change).
function pushUrl(params) {
  const search = params ? `?${new URLSearchParams(params)}` : '';
  if (window.location.search !== search) window.history.pushState(null, '', `${window.location.pathname}${search}`);
}

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
  const [prefill, setPrefill] = useState(null);

  const data = useMemo(() => (brandName ? buildData(brandName) : null), [brandName]);

  const [linkPrefill, setLinkPrefill] = useState(null);

  // State setters are stable, so actions are created once and never go stale.
  const actions = useMemo(() => {
    const reset = () => { setSelectedId(null); setPrefill(null); setLinkPrefill(null); };
    const openTool = (v) => { setBrandName(null); setStatus('ready'); setView(v); };
    return {
      setView,
      startScan: (name) => { reset(); pushUrl({ brand: name }); setBrandName(name); setStatus('scanning'); },
      finishScan: () => { setStatus('ready'); setView('dashboard'); },
      goHome: () => { reset(); pushUrl(null); setBrandName(null); setStatus('idle'); setView('dashboard'); },
      openProfile: setSelectedId,
      closeProfile: () => setSelectedId(null),
      markReported: (id) => setReported((r) => ({ ...r, [id]: true })),
      recordAnalysis: () => setAnalyzedCount((c) => c + 1),
      clearPrefill: () => setPrefill(null),
      clearLinkPrefill: () => setLinkPrefill(null),
      sendToAnalyzer: (text) => { setPrefill(text); setSelectedId(null); setView('scam'); },
      openAnalyzerWith: (text) => { reset(); setPrefill(text); pushUrl({ view: 'scam' }); openTool('scam'); },
      openLinkScanner: (url) => { reset(); setLinkPrefill(url || null); pushUrl({ view: 'link' }); openTool('link'); },
      // Restores state from the address bar (first load and Back/Forward).
      applyUrl: () => {
        const q = new URLSearchParams(window.location.search);
        const brand = q.get('brand');
        const v = q.get('view');
        reset();
        if (brand && getBrand(brand)) { setBrandName(brand); setStatus('ready'); setView('dashboard'); }
        else if (v === 'scam' || v === 'link') openTool(v);
        else { setBrandName(null); setStatus('idle'); setView('dashboard'); }
      },
    };
  }, []);

  useEffect(() => {
    actions.applyUrl();
    window.addEventListener('popstate', actions.applyUrl);
    return () => window.removeEventListener('popstate', actions.applyUrl);
  }, [actions]);

  const value = useMemo(
    () => ({ data, status, view, reported, selectedId, analyzedCount, prefill, linkPrefill, ...actions }),
    [data, status, view, reported, selectedId, analyzedCount, prefill, linkPrefill, actions]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
