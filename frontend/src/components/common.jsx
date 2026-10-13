'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Facebook, Instagram, Send, Twitter, MessageSquare } from 'lucide-react';

export const BAND_STYLES = {
  high: { badge: 'bg-red-500/15 text-red-300 ring-red-500/40', bar: 'bg-red-500', hex: '#ef4444', text: 'text-red-400' },
  medium: { badge: 'bg-amber-500/15 text-amber-300 ring-amber-500/40', bar: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-400' },
  low: { badge: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40', bar: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-400' },
};

export function RiskBadge({ band, score, testId }) {
  return (
    <span data-testid={testId} className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ring-1', BAND_STYLES[band.key].badge)}>
      {score !== undefined && <span className="tabular-nums">{score}</span>}
      <span>{band.label}</span>
    </span>
  );
}

const PLATFORM_ICONS = { Instagram, Facebook, X: Twitter, Telegram: Send, SMS: MessageSquare };
const PLATFORM_COLORS = { Instagram: 'text-pink-400', Facebook: 'text-blue-400', X: 'text-slate-200', Telegram: 'text-sky-400', SMS: 'text-slate-400' };

export function PlatformIcon({ platform, className = 'h-4 w-4' }) {
  const Icon = PLATFORM_ICONS[platform] || MessageSquare;
  return <Icon className={clsx(className, PLATFORM_COLORS[platform])} aria-label={platform} />;
}

export function Avatar({ name, size = 'h-10 w-10 text-sm' }) {
  const initials = name.replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <div className={clsx('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500/30 to-slate-700 font-semibold text-teal-100 ring-1 ring-white/10', size)}>{initials}</div>;
}

export function Card({ className, children, ...props }) {
  return <div className={clsx('rounded-xl border border-slate-800 bg-slate-900/80', className)} {...props}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1.5 text-base text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Popover({ trigger, children, testId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button data-testid={testId} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200">
        {trigger}
      </button>
      {open && (
        <div data-testid={`${testId}-content`} className="absolute right-0 z-20 mt-2 w-96 animate-fade-in rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl shadow-black/50">
          {children}
        </div>
      )}
    </div>
  );
}

export const Button = ({ variant = 'primary', className, ...props }) => (
  <button
    className={clsx(
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-[background-color,transform,color] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && 'bg-teal-500 text-slate-950 hover:bg-teal-400',
      variant === 'ghost' && 'border border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800',
      className
    )}
    {...props}
  />
);

export const fmt = (n) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const fmtAge = (d) => (d < 365 ? `${d} day${d === 1 ? '' : 's'}` : `${(d / 365).toFixed(1)} yrs`);

export function Footer() {
  return (
    <footer data-testid="app-footer" className="border-t border-slate-800/80 px-6 py-4 text-center text-sm text-slate-500">
      Prototype - runs on simulated data. Real platform APIs plug in at the data layer.
    </footer>
  );
}
