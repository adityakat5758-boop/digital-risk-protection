'use client';
import { useState } from 'react';
import { Search, ShieldCheck, Info, Link2, MessageSquareWarning } from 'lucide-react';
import { useApp } from './AppContext';
import { isSupportedBrand, SUPPORTED_BRANDS } from '@/data/provider';
import { Footer } from './common';
import { LinkInput, UrlBanner } from './LinkScanner';
import { looksLikeUrl } from '@/lib/linkScanner';
import { MAX_MESSAGE_LENGTH } from '@/lib/scamAnalyzer';

const CHIP = 'rounded-full border border-teal-500/40 bg-teal-500/10 px-4 py-1.5 font-medium text-teal-200 transition-colors hover:bg-teal-500/20';
const EXAMPLE_BRANDS = ['Zenvyra', 'Paynest', 'Bytebite', 'Learnova'];

export function BrandSearch({ compact = false, onLink }) {
  const { startScan, openLinkScanner } = useApp();
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);
  const isUrl = looksLikeUrl(query);

  const run = (name) => {
    if (!name.trim() || looksLikeUrl(name)) return;
    if (!isSupportedBrand(name)) return setError(true);
    setError(false);
    startScan(name.trim());
  };

  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); run(query); }} className={`group relative flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 shadow-2xl shadow-teal-950/40 transition-colors focus-within:border-teal-500/70 ${compact ? 'p-1.5' : 'p-2'}`}>
        <Search className="ml-3 h-6 w-6 shrink-0 text-slate-500 group-focus-within:text-teal-400" />
        <input
          data-testid={compact ? 'compact-search-input' : 'brand-search-input'}
          autoFocus={!compact}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(false); }}
          placeholder={compact ? 'Search another brand...' : 'Enter a brand name to scan...'}
          className={`min-w-0 flex-1 bg-transparent px-4 text-white placeholder:text-slate-500 focus:outline-none ${compact ? 'py-2 text-base' : 'py-3 text-lg'}`}
        />
        <button data-testid={compact ? 'compact-search-submit' : 'brand-search-submit'} type="submit" className={`rounded-xl bg-teal-500 font-semibold text-slate-950 transition-colors hover:bg-teal-400 active:scale-[0.98] ${compact ? 'px-5 py-2 text-sm' : 'px-6 py-3 text-base'}`}>
          Scan
        </button>
      </form>
      {isUrl && <UrlBanner onUse={() => (onLink ? onLink(query.trim()) : openLinkScanner(query.trim()))} />}
      {error && (
        <p data-testid="brand-unsupported-msg" className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-300">
          <Info className="h-4 w-4" /> Demo dataset covers {SUPPORTED_BRANDS.join(', ')}
        </p>
      )}
      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span>Try:</span>
          {EXAMPLE_BRANDS.map((b) => (
            <button key={b} data-testid={`example-chip-${b.toLowerCase()}`} onClick={() => { setQuery(b); run(b); }} className={CHIP}>
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageTab({ onLink }) {
  const { openAnalyzerWith } = useApp();
  const [text, setText] = useState('');
  const isUrl = looksLikeUrl(text);
  return (
    <div>
      <textarea data-testid="home-message-input" autoFocus value={text} maxLength={MAX_MESSAGE_LENGTH} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Paste a suspicious message (English or Hinglish)..." className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-base text-white placeholder:text-slate-500 transition-colors focus:border-teal-500/70 focus:outline-none" />
      {isUrl && <UrlBanner onUse={() => onLink(text.trim())} />}
      <button data-testid="home-message-submit" disabled={!text.trim() || isUrl} onClick={() => openAnalyzerWith(text)} className="mt-3 rounded-xl bg-teal-500 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50">
        Analyze message
      </button>
    </div>
  );
}

function LinkTab({ initial }) {
  const { openLinkScanner } = useApp();
  const [value, setValue] = useState(initial);
  return <LinkInput value={value} onChange={setValue} onScan={openLinkScanner} autoFocus />;
}

const TABS = [['brand', 'Brand Scan', Search], ['message', 'Scam Message', MessageSquareWarning], ['link', 'Scam Link', Link2]];

function HomeTabs() {
  const [tab, setTab] = useState('brand');
  const [carried, setCarried] = useState('');
  const toLink = (url) => { setCarried(url); setTab('link'); };
  return (
    <div>
      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} data-testid={`home-tab-${id}`} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${tab === id ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'brand' && <BrandSearch onLink={toLink} />}
      {tab === 'message' && <MessageTab onLink={toLink} />}
      {tab === 'link' && <LinkTab key={carried} initial={carried} />}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="grid-bg flex min-h-screen flex-col">
      <header className="flex items-center gap-2.5 px-8 py-6">
        <ShieldCheck className="h-7 w-7 text-teal-400" />
        <span className="text-xl font-bold tracking-tight text-white">BrandGuard</span>
      </header>
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24">
        <p className="mb-5 animate-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">Digital Risk Protection</p>
        <h1 className="animate-fade-up text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl" style={{ animationDelay: '80ms' }}>
          Protect your brand from impersonation
        </h1>
        <p className="mt-5 max-w-2xl animate-fade-up text-lg text-slate-400" style={{ animationDelay: '160ms' }}>
          Find fake profiles, scam messages and lookalike apps across Instagram, Facebook, X, Telegram and app stores. Every risk score is fully explainable.
        </p>
        <div className="mt-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <HomeTabs />
        </div>
      </section>
      <Footer />
    </div>
  );
}
