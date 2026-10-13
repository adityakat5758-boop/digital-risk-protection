'use client';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AlertOctagon, CheckCircle2, Languages, Link2, Phone, Sparkles, Wallet } from 'lucide-react';
import { useApp } from './AppContext';
import { Button, Card, PageHeader } from './common';
import { analyzeMessage, keywordRegex, MAX_MESSAGE_LENGTH } from '@/lib/scamAnalyzer';

// Splits text into plain and keyword segments, each keyed by its character offset.
function segment(text, keywords) {
  if (!keywords.length) return [{ start: 0, text, hit: false }];
  const re = new RegExp(keywords.map((k) => keywordRegex(k).source).join('|'), 'gi');
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    parts.push({ start: last, text: text.slice(last, m.index), hit: false }, { start: m.index, text: m[0], hit: true });
    last = m.index + m[0].length;
  }
  parts.push({ start: last, text: text.slice(last), hit: false });
  return parts.filter((p) => p.text);
}

function Highlighted({ text, keywords }) {
  return segment(text, keywords).map((p) =>
    p.hit
      ? <mark key={`m${p.start}`} className="rounded bg-amber-400/25 px-0.5 text-amber-100">{p.text}</mark>
      : <Fragment key={`t${p.start}`}>{p.text}</Fragment>
  );
}

function Chip({ icon: Icon, children, testId }) {
  return <span data-testid={testId} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-sm text-slate-200"><Icon className="h-3.5 w-3.5 text-teal-300" />{children}</span>;
}

function Result({ r, text }) {
  const scam = r.isScam;
  const { links, phones, upis } = r.entities;
  return (
    <Card data-testid="scam-result" className="animate-fade-up p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span data-testid="scam-type-badge" className={clsx('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-base font-semibold ring-1', scam ? 'bg-red-500/15 text-red-300 ring-red-500/40' : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40')}>
          {scam ? <AlertOctagon className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />} {r.type}
        </span>
        <span data-testid="scam-language-badge" className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300"><Languages className="h-3.5 w-3.5" /> {r.language}</span>
        <span data-testid="scam-source-badge" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 px-3 py-1 text-xs font-medium text-teal-300"><Sparkles className="h-3 w-3" /> {r.source}</span>
      </div>

      {scam && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-400">Confidence</span><span data-testid="scam-confidence" className="font-semibold text-white">{r.confidence}%</span></div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-red-500 transition-[width] duration-700" style={{ width: `${r.confidence}%` }} /></div>
        </div>
      )}

      <p data-testid="scam-highlighted-text" className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4 text-base leading-relaxed text-slate-200"><Highlighted text={text} keywords={r.keywords} /></p>

      {(links.length + phones.length + upis.length > 0) && (
        <div data-testid="scam-entities" className="mt-4 flex flex-wrap gap-2">
          {links.map((l) => <Chip key={l} icon={Link2}>{l}</Chip>)}
          {phones.map((p) => <Chip key={p} icon={Phone}>{p}</Chip>)}
          {upis.map((u) => <Chip key={u} icon={Wallet}>UPI: {u}</Chip>)}
        </div>
      )}

      <p data-testid="scam-explanation" className="mt-5 text-base text-slate-300">{r.explanation}</p>
      {scam ? (
        <p data-testid="scam-action" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-base font-medium text-red-200">
          Do not click or pay. Report the account to the platform and at cybercrime.gov.in (India).
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-base text-emerald-200">Looks legitimate. When in doubt, verify through official channels only.</p>
      )}
    </Card>
  );
}

function MessageInput({ text, onChange, onAnalyze, loading }) {
  return (
    <Card className="p-5">
      <textarea
        data-testid="scam-textarea"
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        placeholder="e.g. Badhai ho! Aap lucky draw ke winner hain..."
        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-4 text-base text-white placeholder:text-slate-600 transition-colors focus:border-teal-500 focus:outline-none"
      />
      <Button data-testid="analyze-btn" className="mt-4 w-full py-3 text-base" disabled={!text.trim() || loading} onClick={onAnalyze}>
        {loading ? 'Analyzing...' : 'Analyze message'}
      </Button>
    </Card>
  );
}

function SampleChips({ messages, onPick }) {
  if (!messages.length) return null;
  return (
    <>
      <p className="mb-3 mt-6 text-sm font-medium text-slate-400">Load sample</p>
      <div className="flex flex-wrap gap-2">
        {messages.map((m, i) => (
          <button
            key={m.id}
            data-testid={`sample-chip-${i + 1}`}
            title={m.text}
            onClick={() => onPick(m.text)}
            className="max-w-[230px] truncate rounded-full border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-sm text-slate-300 transition-colors hover:border-teal-500/50 hover:text-white"
          >
            #{i + 1} {m.text.replace(/[^\w\s!']/g, '').trim().slice(0, 26)}…
          </button>
        ))}
      </div>
    </>
  );
}

const SKELETON_WIDTHS = [40, 100, 90, 70];

function ResultPanel({ loading, result }) {
  if (loading) {
    return (
      <Card data-testid="scam-loading" className="space-y-4 p-6">
        {SKELETON_WIDTHS.map((w) => <div key={w} className="h-5 animate-pulse rounded bg-slate-800" style={{ width: `${w}%` }} />)}
      </Card>
    );
  }
  if (result) return <Result r={result.r} text={result.text} />;
  return (
    <Card data-testid="scam-empty" className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 border-dashed p-6 text-center text-slate-500">
      <AlertOctagon className="h-8 w-8" />
      <p className="text-base">Paste a message or load a sample, then click Analyze.</p>
    </Card>
  );
}

export default function ScamAnalyzer() {
  const { data, recordAnalysis, prefill, clearPrefill } = useApp();
  const [text, setText] = useState(prefill || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const officialDomains = data?.brand.officialDomains;

  const analyze = useCallback(async (input) => {
    setLoading(true);
    setResult(null);
    const r = await analyzeMessage(input, officialDomains ? { officialDomains } : undefined);
    setResult({ r, text: input });
    setLoading(false);
    recordAnalysis();
  }, [officialDomains, recordAnalysis]);

  // Auto-run once when a message was sent here from another screen.
  const started = useRef(false);
  useEffect(() => {
    if (!prefill || started.current) return;
    started.current = true;
    clearPrefill();
    analyze(prefill);
  }, [prefill, clearPrefill, analyze]);

  return (
    <div>
      <PageHeader title="Scam Analyzer" subtitle="Paste a suspicious message. Understands English and Hinglish." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <MessageInput text={text} onChange={setText} onAnalyze={() => analyze(text)} loading={loading} />
          <SampleChips messages={data?.messages ?? []} onPick={(t) => { setText(t); setResult(null); }} />
        </div>
        <div>
          <ResultPanel loading={loading} result={result} />
        </div>
      </div>
    </div>
  );
}
