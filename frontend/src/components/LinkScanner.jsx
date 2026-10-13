'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, Link2, RotateCcw, ShieldAlert } from 'lucide-react';
import { useApp } from './AppContext';
import { BAND_STYLES, Button, Card, CountUp, PageHeader } from './common';
import { scanLink } from '@/lib/linkScanner';

export const EXAMPLE_LINKS = [
  'https://paynest-cashback.example/claim',
  'https://bytebite-refund.example/form',
  'https://learnova-internship.example/apply',
];

const ACTIONS = ['Do not click or open this link.', 'Do not enter personal, login or payment details.', 'Report the link to the platform and at cybercrime.gov.in (India).'];

export function UrlBanner({ onUse }) {
  return (
    <div data-testid="url-detected-banner" className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
      <Link2 className="h-4 w-4" /> This looks like a link. Scan it with the Link Scanner
      <button data-testid="use-link-scanner-btn" onClick={onUse} className="ml-auto rounded-md bg-amber-400/20 px-3 py-1 font-semibold text-amber-100 transition-colors hover:bg-amber-400/30">Open Link Scanner</button>
    </div>
  );
}

export function LinkInput({ value, onChange, onScan, inputRef, autoFocus }) {
  return (
    <div className="w-full">
      <form onSubmit={(e) => { e.preventDefault(); onScan(value); }} className="group flex items-center rounded-2xl border border-slate-700 bg-slate-900/90 p-2 transition-colors focus-within:border-teal-500/70">
        <Link2 className="ml-3 h-6 w-6 shrink-0 text-slate-500 group-focus-within:text-teal-400" />
        <input ref={inputRef} data-testid="link-input" autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste a suspicious link..." className="min-w-0 flex-1 bg-transparent px-4 py-3 text-lg text-white placeholder:text-slate-500 focus:outline-none" />
        <button data-testid="link-scan-btn" type="submit" className="rounded-xl bg-teal-500 px-6 py-3 text-base font-semibold text-slate-950 transition-colors hover:bg-teal-400 active:scale-[0.98]">Scan</button>
      </form>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <span>Try a suspicious link:</span>
        {EXAMPLE_LINKS.map((l, i) => (
          <button key={l} data-testid={`example-link-chip-${i + 1}`} onClick={() => onChange(l)} className="rounded-full border border-teal-500/40 bg-teal-500/10 px-4 py-1.5 font-medium text-teal-200 transition-colors hover:bg-teal-500/20">{l}</button>
        ))}
      </div>
    </div>
  );
}

function LinkResult({ r, onAnother, onNewSearch }) {
  const style = BAND_STYLES[r.verdict.key];
  return (
    <Card data-testid="link-result" className="animate-fade-up p-6">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-5xl font-bold tabular-nums text-white" data-testid="link-score"><CountUp value={r.score} /></p>
        <span data-testid="link-verdict" className={clsx('rounded-full px-3.5 py-1.5 text-base font-semibold ring-1', style.badge)}>{r.verdict.label}</span>
        <span data-testid="link-brand" className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
          {r.brand ? `${r.official ? 'Official' : 'Impersonates'}: ${r.brand}` : 'No brand match'}
        </span>
      </div>
      <p className="mt-3 break-all text-sm text-slate-400">{r.url}</p>
      <ul data-testid="link-reasons" className="mt-5 space-y-2">
        {r.reasons.map((x) => (
          <li key={x.name} className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
            <span className={clsx('w-12 shrink-0 text-right text-lg font-bold tabular-nums', x.points ? 'text-red-300' : 'text-slate-500')}>+{x.points}</span>
            <div><p className="font-semibold text-white">{x.name}</p><p className="text-sm text-slate-400">{x.reason}</p></div>
          </li>
        ))}
      </ul>
      {r.score >= 30 && (
        <ul data-testid="link-actions" className="mt-5 space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-200">
          {ACTIONS.map((a) => <li key={a} className="flex gap-2"><ShieldAlert className="mt-1 h-4 w-4 shrink-0" />{a}</li>)}
        </ul>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button data-testid="scan-another-link-btn" onClick={onAnother}><RotateCcw className="h-4 w-4" /> Scan Another Link</Button>
        <Button data-testid="link-new-search-btn" variant="ghost" onClick={onNewSearch}><ArrowLeft className="h-4 w-4" /> New Search</Button>
      </div>
    </Card>
  );
}

export default function LinkScanner() {
  const { linkPrefill, clearLinkPrefill, goHome } = useApp();
  const [value, setValue] = useState(linkPrefill || '');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const scan = (v) => setResult(scanLink(v));
  const another = () => { setValue(''); setResult(null); inputRef.current?.focus(); };

  const started = useRef(false);
  useEffect(() => {
    if (!linkPrefill || started.current) return;
    started.current = true;
    clearLinkPrefill();
    setResult(scanLink(linkPrefill));
  }, [linkPrefill, clearLinkPrefill]);

  return (
    <div>
      <PageHeader title="Scam Link Scanner" subtitle="Checks a link's structure safely. The link is never opened." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="min-w-0">
          <LinkInput value={value} onChange={setValue} onScan={scan} inputRef={inputRef} />
          {result?.error && <p data-testid="link-error" className="mt-4 text-sm text-amber-300">{result.error}</p>}
        </div>
        <div className="min-w-0">
          {result && !result.error ? <LinkResult r={result} onAnother={another} onNewSearch={goHome} /> : (
            <Card data-testid="link-empty" className="flex min-h-[260px] flex-col items-center justify-center gap-3 border-dashed p-6 text-center text-slate-500">
              <Link2 className="h-8 w-8" /><p className="text-base">Paste a link or pick an example, then click Scan.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
