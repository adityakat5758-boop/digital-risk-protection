'use client';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Radar } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from './AppContext';

const STEPS = ['Instagram', 'Facebook', 'X', 'Telegram', 'App stores'];
const DURATION = 2000;
const BLIPS = [[22, 30, 400], [70, 26, 900], [62, 72, 1300], [30, 66, 1700]];

export default function Scanning() {
  const { finishScan, data } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    let done;
    const t = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(Math.min(e, DURATION));
      if (e >= DURATION) { clearInterval(t); done = setTimeout(finishScan, 200); }
    }, 40);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [finishScan]);

  const blips = useMemo(() => BLIPS.filter(([, , t]) => elapsed > t), [elapsed]);
  const pct = Math.round((elapsed / DURATION) * 100);
  const active = Math.min(STEPS.length - 1, Math.floor((elapsed / DURATION) * STEPS.length));

  return (
    <div data-testid="scanning-overlay" className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-lg px-6">
        <div data-testid="radar" className="relative mx-auto mb-8 h-48 w-48">
          {[0, 6, 12, 18].map((i) => <div key={i} className="absolute rounded-full border border-teal-500/25" style={{ inset: `${i * 4}px` }} />)}
          <div className="absolute inset-x-0 top-1/2 h-px bg-teal-500/20" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-teal-500/20" />
          <div className="absolute inset-0 animate-sweep rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(45,212,191,0.5), transparent 30%)' }} />
          {blips.map(([x, y]) => (
            <span key={`${x}-${y}`} className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-red-400" style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
          <Radar className="absolute inset-0 m-auto h-8 w-8 text-teal-300" />
        </div>
        <h2 className="text-center text-2xl font-bold text-white">Scanning for &ldquo;{data?.brand.name}&rdquo; impersonators</h2>
        <p data-testid="scanning-step" className="mt-2 text-center text-base text-teal-300">Scanning {STEPS[active]}...</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
          <div data-testid="scanning-progress" className="h-full rounded-full bg-teal-400 transition-[width] duration-75" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-6 space-y-2.5">
          {STEPS.map((s, i) => (
            <li key={s} className={clsx('flex items-center gap-3 text-base transition-colors', i < active || pct === 100 ? 'text-slate-300' : i === active ? 'text-white' : 'text-slate-600')}>
              {i < active || pct === 100 ? <CheckCircle2 className="h-5 w-5 text-teal-400" /> : i === active ? <Loader2 className="h-5 w-5 animate-spin text-teal-300" /> : <span className="h-5 w-5 rounded-full border border-slate-700" />}
              Scanning {s}...
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
