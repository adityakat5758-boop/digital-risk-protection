'use client';
import { AlertTriangle, AppWindow, ChevronRight, MessageSquareWarning, RefreshCw, Users } from 'lucide-react';
import { useApp } from './AppContext';
import { Avatar, BAND_STYLES, Button, Card, CountUp, PageHeader, PlatformIcon, RiskBadge } from './common';
import ThreatNetwork from './ThreatNetwork';
import { topSignal } from '@/lib/riskEngine';

function Stat({ icon: Icon, label, value, sub, testId, accent = 'text-teal-300', delay }) {
  return (
    <Card className="animate-fade-up p-5 hover:-translate-y-1" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between text-sm text-slate-400">
        {label} <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <p data-testid={testId} className="mt-3 text-4xl font-bold tabular-nums text-white"><CountUp value={value} /></p>
      <p className="mt-1 text-sm text-slate-500">{sub}</p>
    </Card>
  );
}

function RiskDonut({ profiles }) {
  const counts = ['high', 'medium', 'low'].map((k) => ({ k, n: profiles.filter((p) => p.risk.band.key === k).length }));
  const total = profiles.length;
  let acc = 0;
  const stops = counts.map(({ k, n }) => { const s = acc; acc += (n / total) * 100; return `${BAND_STYLES[k].hex} ${s}% ${acc}%`; }).join(', ');
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">Risk distribution</h2>
      <div className="mt-6 flex items-center gap-8">
        <div className="relative h-40 w-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-slate-900">
            <span className="text-3xl font-bold text-white">{total}</span>
            <span className="text-sm text-slate-400">profiles</span>
          </div>
        </div>
        <ul className="space-y-3">
          {counts.map(({ k, n }) => (
            <li key={k} data-testid={`risk-dist-${k}`} className="flex items-center gap-3 text-base">
              <span className={`h-3 w-3 rounded-full ${BAND_STYLES[k].bar}`} />
              <span className="w-20 capitalize text-slate-300">{k}</span>
              <span className="font-semibold tabular-nums text-white">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function PlatformBars({ profiles }) {
  const flagged = profiles.filter((p) => p.risk.score >= 20);
  const platforms = [...new Set(profiles.map((p) => p.platform))]
    .map((pl) => ({ pl, items: flagged.filter((p) => p.platform === pl) }))
    .sort((a, b) => b.items.length - a.items.length);
  const max = Math.max(...platforms.map((p) => p.items.length), 1);
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-white">Flagged by platform</h2>
      <ul className="mt-6 space-y-4">
        {platforms.map(({ pl, items }) => (
          <li key={pl} data-testid={`platform-bar-${pl}`} className="flex items-center gap-3">
            <span className="flex w-28 items-center gap-2 text-sm text-slate-300"><PlatformIcon platform={pl} /> {pl}</span>
            <div className="flex h-6 flex-1 overflow-hidden rounded-md bg-slate-800">
              <div className="flex h-full transition-[width] duration-700" style={{ width: `${(items.length / max) * 100}%` }}>
                {['high', 'medium', 'low'].map((k) => {
                  const n = items.filter((p) => p.risk.band.key === k).length;
                  return n ? <div key={k} className={BAND_STYLES[k].bar} style={{ width: `${(n / items.length) * 100}%` }} /> : null;
                })}
              </div>
            </div>
            <span className="w-6 text-right font-semibold tabular-nums text-white">{items.length}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function Dashboard() {
  const { data, reported, openProfile, startScan, analyzedCount } = useApp();
  const { profiles, apps, messages, brand } = data;
  const high = profiles.filter((p) => p.risk.band.key === 'high');
  const reportedCount = Object.keys(reported).length;
  const fakeApps = apps.filter((a) => a.check.score >= 40).length;
  const scams = messages.filter((m) => m.analysis.isScam).length;
  const platformCount = new Set(profiles.map((p) => p.platform)).size;

  return (
    <div>
      <PageHeader title={`${brand.name} threat overview`} subtitle="Live impersonation scan across social platforms and app stores.">
        <Button data-testid="scan-again-btn" variant="ghost" onClick={() => startScan(brand.name)}>
          <RefreshCw className="h-4 w-4" /> Scan again
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Profiles scanned" value={profiles.length} sub={`Across ${platformCount} platform${platformCount === 1 ? '' : 's'}`} testId="stat-profiles-scanned" delay="0ms" />
        <Stat icon={AlertTriangle} label="High-risk profiles" value={high.length} sub={`${reportedCount} reported`} testId="stat-high-risk" accent="text-red-400" delay="60ms" />
        <Stat icon={AppWindow} label="Fake apps found" value={fakeApps} sub={`of ${apps.length} listings checked`} testId="stat-fake-apps" accent="text-amber-400" delay="120ms" />
        <Stat icon={MessageSquareWarning} label="Scam messages analyzed" value={messages.length + analyzedCount} sub={`${scams} known scams in dataset`} testId="stat-scam-messages" delay="180ms" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RiskDonut profiles={profiles} />
        <PlatformBars profiles={profiles} />
      </div>

      <ThreatNetwork />
      <TopThreats profiles={profiles.slice(0, 3)} reported={reported} onOpen={openProfile} />
    </div>
  );
}

function TopThreats({ profiles, reported, onOpen }) {
  return (
    <Card className="mt-6 p-6">
      <h2 className="text-lg font-semibold text-white">Top threats</h2>
      <ul className="mt-4 divide-y divide-slate-800">
        {profiles.map((p) => (
          <li key={p.id}>
            <button data-testid={`top-threat-${p.id}`} onClick={() => onOpen(p.id)} className="group flex w-full items-center gap-4 rounded-lg px-2 py-4 text-left transition-colors hover:bg-slate-800/50">
              <Avatar name={p.displayName} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-base font-semibold text-white">
                  <PlatformIcon platform={p.platform} /> @{p.handle}
                  {reported[p.id] && <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200">Reported</span>}
                </p>
                <p className="truncate text-sm text-slate-400">{topSignal(p.risk).reason}</p>
              </div>
              <RiskBadge band={p.risk.band} score={p.risk.score} />
              <ChevronRight className="h-5 w-5 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-teal-300" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
