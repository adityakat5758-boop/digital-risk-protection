'use client';
import clsx from 'clsx';
import { AppWindow, LayoutDashboard, MessageSquareWarning, ShieldCheck, Users } from 'lucide-react';
import { useApp } from './AppContext';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'scam', label: 'Scam Analyzer', icon: MessageSquareWarning },
  { id: 'apps', label: 'App Checker', icon: AppWindow },
];

export default function Sidebar() {
  const { view, setView, data } = useApp();
  return (
    <aside className="z-30 border-b border-slate-800 bg-slate-950 md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 px-6 py-5 md:py-7">
        <ShieldCheck className="h-7 w-7 text-teal-400" />
        <span className="text-xl font-bold tracking-tight text-white">BrandGuard</span>
      </div>
      {data && (
        <div className="mx-4 mb-4 hidden rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 md:block">
          <p className="text-xs uppercase tracking-wider text-slate-500">Monitoring</p>
          <p data-testid="sidebar-brand-name" className="mt-0.5 text-base font-semibold text-white">{data.brand.name}</p>
        </div>
      )}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            data-testid={`nav-${id}`}
            onClick={() => setView(id)}
            className={clsx(
              'flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-colors',
              view === id ? 'bg-teal-500/15 text-teal-200' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            )}
          >
            <Icon className="h-5 w-5" /> {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
