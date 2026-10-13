'use client';
import { useEffect } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { BadgeCheck, Flag, FileText, HelpCircle, X } from 'lucide-react';
import { useApp } from './AppContext';
import { Avatar, BAND_STYLES, Button, PlatformIcon, Popover, RiskBadge, fmt, fmtAge, useCountUp } from './common';
import { WEIGHTS } from '@/lib/riskEngine';

function Gauge({ score: target, band }) {
  const score = useCountUp(target);
  const len = Math.PI * 80;
  return (
    <div className="relative h-28 w-48">
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={BAND_STYLES[band.key].hex} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(len * score) / 100} ${len}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p data-testid="drawer-score" className="text-4xl font-bold tabular-nums text-white">{score}</p>
        <p className={clsx('text-sm font-semibold', BAND_STYLES[band.key].text)}>{band.label} risk</p>
      </div>
    </div>
  );
}

function Compare({ brand, p }) {
  const rows = [
    ['Handle', `@${brand.handle}`, `@${p.handle}`],
    ['Bio', brand.bio, p.bio],
    ['Link', brand.link, p.link || 'None'],
    ['Account age', `Since ${brand.createdYear}`, fmtAge(p.accountAgeDays)],
    ['Followers', `${fmt(brand.followers)} / ${fmt(brand.following)} following`, `${fmt(p.followers)} / ${fmt(p.following)} following`],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="grid grid-cols-[110px_1fr_1fr] bg-slate-800/60 text-sm font-semibold">
        <span className="px-3 py-2.5 text-slate-400" />
        <span className="flex items-center gap-1.5 px-3 py-2.5 text-emerald-300"><BadgeCheck className="h-4 w-4" /> Official</span>
        <span className="px-3 py-2.5 text-red-300">Suspected</span>
      </div>
      {rows.map(([k, a, b]) => (
        <div key={k} className="grid grid-cols-[110px_1fr_1fr] border-t border-slate-800 text-sm">
          <span className="px-3 py-2.5 text-slate-500">{k}</span>
          <span className="break-words px-3 py-2.5 text-slate-300">{a}</span>
          <span className="break-words px-3 py-2.5 text-white">{b}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProfileDrawer() {
  const { data, selectedId, closeProfile, reported, markReported } = useApp();
  const p = data?.profiles.find((x) => x.id === selectedId);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && closeProfile();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [closeProfile]);

  if (!p) return null;
  const linked = data.messages.filter((m) => m.linkedProfileId === p.id);
  const isReported = reported[p.id];

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={closeProfile} data-testid="drawer-backdrop" />
      <aside data-testid="profile-drawer" className="absolute inset-y-0 right-0 flex w-full max-w-2xl animate-slide-in flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-start gap-4 border-b border-slate-800 p-6">
          <Avatar name={p.displayName} size="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-white">
              @{p.handle}
              {isReported && <span data-testid="drawer-reported-badge" className="rounded-full bg-slate-700 px-2.5 py-0.5 text-sm font-medium text-slate-200">Reported</span>}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><PlatformIcon platform={p.platform} /> {p.platform} · {p.displayName}</p>
          </div>
          <button data-testid="drawer-close-btn" onClick={closeProfile} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Gauge score={p.risk.score} band={p.risk.band} />
            <Popover testId="score-explainer" trigger={<><HelpCircle className="h-4 w-4" /> How is this score calculated?</>}>
              <p className="mb-3 text-sm text-slate-300">Score = sum of signal points (0-100). Verified accounts score 0. 70+ High, 40-69 Medium, below 40 Low.</p>
              <ul className="space-y-2.5">
                {WEIGHTS.map((w) => (
                  <li key={w.name} className="text-sm">
                    <span className="font-semibold text-white">{w.name}</span> <span className="text-teal-300">max {w.max}</span>
                    <p className="text-slate-400">{w.rule}</p>
                  </li>
                ))}
              </ul>
            </Popover>
          </div>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-white">Official vs Suspected</h3>
            <Compare brand={data.brand} p={p} />
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-white">Signal breakdown</h3>
            <ul data-testid="signal-breakdown" className="space-y-2">
              {p.risk.signals.map((s) => (
                <li key={s.name} className={clsx('flex items-start gap-4 rounded-lg border px-4 py-3', s.points ? 'border-slate-700 bg-slate-900' : 'border-slate-800/60 bg-transparent opacity-60')}>
                  <span className={clsx('w-12 shrink-0 text-right text-lg font-bold tabular-nums', s.points ? 'text-red-300' : 'text-slate-500')}>+{s.points}</span>
                  <div>
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-sm text-slate-400">{s.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-white">Linked scam messages</h3>
            {linked.length ? (
              <ul className="space-y-2">
                {linked.map((m) => (
                  <li key={m.id} data-testid={`linked-message-${m.id}`} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                    <span className="mb-2 inline-block rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">{m.analysis.type}</span>
                    <p className="text-sm text-slate-300">{m.text}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No scam messages linked to this profile.</p>}
          </section>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-800 p-5">
          <Button data-testid="mark-reported-btn" disabled={isReported} onClick={() => { markReported(p.id); toast.success(`@${p.handle} marked as reported`); }}>
            <Flag className="h-4 w-4" /> {isReported ? 'Reported' : 'Mark as reported'}
          </Button>
          <Button data-testid="generate-report-btn" variant="ghost" onClick={() => toast('Report generation coming in the next step')}>
            <FileText className="h-4 w-4" /> Generate Evidence Report
          </Button>
          <div className="ml-auto self-center"><RiskBadge band={p.risk.band} score={p.risk.score} /></div>
        </div>
      </aside>
    </div>
  );
}
