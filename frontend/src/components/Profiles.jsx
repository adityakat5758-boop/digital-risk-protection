'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { SearchX } from 'lucide-react';
import { useApp } from './AppContext';
import { Avatar, Button, Card, PageHeader, PlatformIcon, RiskBadge, fmt, fmtAge } from './common';
import { topSignal } from '@/lib/riskEngine';

function FilterGroup({ label, options, value, onChange, testPrefix }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-500">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          data-testid={`${testPrefix}-${o.toLowerCase()}`}
          onClick={() => onChange(o)}
          className={clsx('rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors', value === o ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200')}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Profiles() {
  const { data, openProfile, reported } = useApp();
  const [platform, setPlatform] = useState('All');
  const [band, setBand] = useState('All');
  const platforms = ['All', ...new Set(data.profiles.map((p) => p.platform))];
  const rows = data.profiles.filter((p) => (platform === 'All' || p.platform === platform) && (band === 'All' || p.risk.band.label === band));

  return (
    <div>
      <PageHeader title="Profiles" subtitle="Ranked by risk score. Every score is the sum of explainable signals." />
      <div className="mb-5 flex flex-wrap gap-x-8 gap-y-3">
        <FilterGroup label="Platform" options={platforms} value={platform} onChange={setPlatform} testPrefix="filter-platform" />
        <FilterGroup label="Risk" options={['All', 'High', 'Medium', 'Low']} value={band} onChange={setBand} testPrefix="filter-band" />
      </div>
      <Card className="overflow-x-auto">
        <table data-testid="profiles-table" className="w-full min-w-[860px] text-left text-[15px]">
          <thead className="border-b border-slate-800 text-sm text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">Risk</th>
              <th className="px-5 py-4 font-medium">Profile</th>
              <th className="px-5 py-4 font-medium">Followers / Following</th>
              <th className="px-5 py-4 font-medium">Account age</th>
              <th className="px-5 py-4 font-medium">Top reason</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {rows.map((p) => {
              const top = topSignal(p.risk);
              return (
                <tr key={p.id} data-testid={`profile-row-${p.id}`} className="transition-colors hover:bg-slate-800/40">
                  <td className="px-5 py-4"><RiskBadge band={p.risk.band} score={p.risk.score} testId={`profile-score-${p.id}`} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.displayName} />
                      <div>
                        <p className="flex items-center gap-2 font-semibold text-white">
                          @{p.handle} <PlatformIcon platform={p.platform} />
                          {reported[p.id] && <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-200">Reported</span>}
                        </p>
                        <p className="text-sm text-slate-400">{p.displayName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-300">{fmt(p.followers)} / {fmt(p.following)}</td>
                  <td className="px-5 py-4 text-slate-300">{fmtAge(p.accountAgeDays)}</td>
                  <td className="px-5 py-4">
                    {top.points > 0 ? (
                      <span title={top.reason} className="rounded-md bg-slate-800 px-2.5 py-1 text-sm text-slate-300">{top.name} +{top.points}</span>
                    ) : <span className="text-sm text-slate-500">No signals</span>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button data-testid={`investigate-btn-${p.id}`} variant="ghost" onClick={() => openProfile(p.id)}>Investigate</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <div data-testid="profiles-empty" className="flex flex-col items-center gap-2 py-16 text-slate-500">
            <SearchX className="h-8 w-8" /> No profiles match these filters.
          </div>
        )}
      </Card>
    </div>
  );
}
