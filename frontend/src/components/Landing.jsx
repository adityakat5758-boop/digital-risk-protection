'use client';
import { useState } from 'react';
import { Search, ShieldCheck, Info, Link2 } from 'lucide-react';
import { useApp } from './AppContext';
import { isSupportedBrand, SUPPORTED_BRANDS } from '@/data/provider';
import { Footer } from './common';

const CHIP = 'rounded-full border border-teal-500/40 bg-teal-500/10 px-4 py-1.5 font-medium text-teal-200 transition-colors hover:bg-teal-500/20';
const EXAMPLE_BRANDS = ['Zenvyra', 'Paynest', 'Bytebite', 'Learnova'];
const EXAMPLE_LINKS = [
  { id: 'paynest', link: 'https://paynest-cashback.example/claim', text: 'Claim your Paynest cashback reward here: https://paynest-cashback.example/claim' },
  { id: 'bytebite', link: 'https://bytebite-refund.example/form', text: 'Your Bytebite refund is pending. Fill this form to get your money back: https://bytebite-refund.example/form' },
  { id: 'learnova', link: 'https://learnova-internship.example/apply', text: 'Congratulations! You are selected for a Learnova internship. Apply here: https://learnova-internship.example/apply' },
];

export function BrandSearch({ compact = false }) {
  const { startScan, openAnalyzerWith } = useApp();
  const [query, setQuery] = useState('');
  const [error, setError] = useState(false);

  const run = (name) => {
    if (!name.trim()) return;
    if (!isSupportedBrand(name)) return setError(true);
    setError(false);
    startScan(name.trim());
  };

  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); run(query); }} className="group relative flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 p-2 shadow-2xl shadow-teal-950/40 transition-colors focus-within:border-teal-500/70">
        <Search className="ml-3 h-6 w-6 shrink-0 text-slate-500 group-focus-within:text-teal-400" />
        <input
          data-testid="brand-search-input"
          autoFocus={!compact}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(false); }}
          placeholder="Enter a brand name to scan..."
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button data-testid="brand-search-submit" type="submit" className="rounded-xl bg-teal-500 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-teal-400 active:scale-[0.98]">
          Scan
        </button>
      </form>
      {error && (
        <p data-testid="brand-unsupported-msg" className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-300">
          <Info className="h-4 w-4" /> Demo dataset covers {SUPPORTED_BRANDS.join(', ')}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>Try:</span>
        {EXAMPLE_BRANDS.map((b) => (
          <button key={b} data-testid={`example-chip-${b.toLowerCase()}`} onClick={() => { setQuery(b); run(b); }} className={CHIP}>
            {b}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>Try a suspicious link:</span>
        {EXAMPLE_LINKS.map(({ id, link, text }) => (
          <button key={id} data-testid={`example-link-chip-${id}`} onClick={() => openAnalyzerWith(text)} className={`${CHIP} inline-flex items-center gap-1.5`}>
            <Link2 className="h-3.5 w-3.5" /> {link}
          </button>
        ))}
      </div>
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
          <BrandSearch />
        </div>
      </section>
      <Footer />
    </div>
  );
}
