'use client';
import { Fragment, useState } from 'react';
import clsx from 'clsx';
import { BadgeCheck, ChevronDown, Star } from 'lucide-react';
import { useApp } from './AppContext';
import { Card, PageHeader, RiskBadge, fmt } from './common';
import { DANGEROUS_PERMISSIONS } from '@/lib/appChecker';

export default function AppChecker() {
  const { data } = useApp();
  const [open, setOpen] = useState(null);

  return (
    <div>
      <PageHeader title="App Checker" subtitle="App store listings impersonating the brand. Click a row to see why." />
      <Card className="overflow-x-auto">
        <table data-testid="apps-table" className="w-full min-w-[860px] text-left text-[15px]">
          <thead className="border-b border-slate-800 text-sm text-slate-400">
            <tr>
              <th className="px-5 py-4 font-medium">Risk</th>
              <th className="px-5 py-4 font-medium">App</th>
              <th className="px-5 py-4 font-medium">Developer</th>
              <th className="px-5 py-4 font-medium">Installs</th>
              <th className="px-5 py-4 font-medium">Rating</th>
              <th className="px-5 py-4 font-medium">Permissions</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {data.apps.map((a) => (
              <Fragment key={a.id}>
                <tr data-testid={`app-row-${a.id}`} onClick={() => setOpen(open === a.id ? null : a.id)} className="cursor-pointer border-t border-slate-800/70 transition-colors hover:bg-slate-800/40">
                  <td className="px-5 py-4">
                    {a.check.isOfficial ? (
                      <span data-testid={`app-official-${a.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1 text-sm font-semibold text-teal-200 ring-1 ring-teal-500/40"><BadgeCheck className="h-4 w-4" /> Official</span>
                    ) : <RiskBadge band={a.check.band} score={a.check.score} testId={`app-score-${a.id}`} />}
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">{a.title}</td>
                  <td className="px-5 py-4 text-slate-300">{a.developer}</td>
                  <td className="px-5 py-4 tabular-nums text-slate-300">{fmt(a.installs)}</td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-1 text-slate-300"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{a.rating}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-xs flex-wrap gap-1.5">
                      {a.permissions.map((p) => (
                        <span key={p} className={clsx('rounded px-2 py-0.5 text-xs font-medium', DANGEROUS_PERMISSIONS.includes(p) ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30' : 'bg-slate-800 text-slate-400')}>{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4"><ChevronDown className={clsx('h-5 w-5 text-slate-500 transition-transform', open === a.id && 'rotate-180')} /></td>
                </tr>
                {open === a.id && (
                  <tr data-testid={`app-reasons-${a.id}`} className="bg-slate-950/60">
                    <td colSpan={7} className="px-5 py-4">
                      <ul className="animate-fade-in space-y-2">
                        {a.check.reasons.map((r) => (
                          <li key={r.name} className="flex gap-4 text-sm">
                            <span className={clsx('w-10 text-right font-bold tabular-nums', r.points ? 'text-red-300' : 'text-slate-500')}>+{r.points}</span>
                            <span className="font-semibold text-white">{r.name}</span>
                            <span className="text-slate-400">{r.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
