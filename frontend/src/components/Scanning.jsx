'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Radar } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from './AppContext';

const STEPS = ['Instagram', 'Facebook', 'X', 'Telegram', 'App stores'];
const DURATION = 2500;

export default function Scanning() {
  const { finishScan, data } = useApp();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(Math.min(e, DURATION));
      if (e >= DURATION) { clearInterval(t); setTimeout(finishScan, 200); }
    }, 40);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round((elapsed / DURATION) * 100);
  const active = Math.min(STEPS.length - 1, Math.floor((elapsed / DURATION) * STEPS.length));

  return (
    <div data-testid="scanning-overlay" className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-950/95 backdrop-blur-sm">
      <div className="w-full max-w-lg px-6">
        <div className="relative mx-auto mb-8 h-28 w-28">
          <div className="absolute inset-0 rounded-full border border-teal-500/30" />
          <div className="absolute inset-3 rounded-full border border-teal-500/20" />
          <div className="absolute inset-0 animate-sweep rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(45,212,191,0.45), transparent 35%)' }} />
          <Radar className="absolute inset-0 m-auto h-10 w-10 text-teal-300" />
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
