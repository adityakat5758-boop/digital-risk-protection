'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';
import { Box, Square } from 'lucide-react';
import { useApp } from './AppContext';
import { BAND_STYLES, Card } from './common';
import { buildThreatGraph } from '@/lib/threatGraph';

const GraphSkeleton = () => <div data-testid="threat-graph-skeleton" className="h-full w-full animate-pulse rounded-lg bg-slate-800/60" />;
const Graph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false, loading: GraphSkeleton });
const Graph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false, loading: GraphSkeleton });

const HEIGHT = 440;
const nodeColor = (n) => (n.isBrand ? '#2dd4bf' : BAND_STYLES[n.band].hex);
const tooltip = (n) =>
  `<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:6px 10px;font:14px Inter,sans-serif;color:#e2e8f0">${n.isBrand ? `<b>${n.label}</b> (official)` : `<b>${n.label}</b><br/>Risk score: ${n.score}`}</div>`;

export default function ThreatNetwork() {
  const { data, openProfile } = useApp();
  const [mode, setMode] = useState('3d');
  const [width, setWidth] = useState(0);
  const box = useRef(null);
  const fg = useRef(null);
  const graph = useMemo(() => buildThreatGraph(data.brand, data.profiles, data.messages), [data]);
  const shared = graph.links.filter((l) => l.kind === 'shared').length;

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const common = {
    graphData: graph,
    width,
    height: HEIGHT,
    backgroundColor: '#0b1220',
    nodeLabel: tooltip,
    nodeColor,
    nodeVal: 'val',
    linkColor: (l) => (l.kind === 'shared' ? 'rgba(248,113,113,0.85)' : 'rgba(100,116,139,0.35)'),
    linkWidth: (l) => (l.kind === 'shared' ? 2 : 0.6),
    linkLabel: (l) => l.label || '',
    onNodeClick: (n) => !n.isBrand && openProfile(n.id),
    cooldownTicks: 120,
    ref: fg,
    onEngineStop: () => fg.current?.zoomToFit?.(500, 60),
  };

  return (
    <Card data-testid="threat-network-card" className="mt-6 p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Threat network</h2>
          <p className="text-sm text-slate-400">{graph.nodes.length - 1} suspects, {shared} shared-infrastructure links. Drag to rotate, click a node to investigate.</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 p-1">
          {[['3d', '3D', Box], ['2d', '2D', Square]].map(([m, label, Icon]) => (
            <button key={m} data-testid={`graph-toggle-${m}`} onClick={() => setMode(m)} className={clsx('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors', mode === m ? 'bg-teal-500/20 text-teal-200' : 'text-slate-400 hover:text-white')}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div ref={box} data-testid="threat-graph" className="relative overflow-hidden rounded-lg border border-slate-800" style={{ height: HEIGHT }}>
        {width > 0 && (mode === '3d'
          ? <Graph3D {...common} showNavInfo={false} nodeOpacity={0.95} nodeResolution={16} linkDirectionalParticles={(l) => (l.kind === 'shared' ? 2 : 0)} linkDirectionalParticleColor={() => '#fca5a5'} />
          : <Graph2D {...common} nodeRelSize={2.5} linkDirectionalParticles={(l) => (l.kind === 'shared' ? 2 : 0)} />)}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-400" />Official</span>
          {['high', 'medium', 'low'].map((k) => <span key={k} className="flex items-center gap-1.5 capitalize"><span className={`h-2.5 w-2.5 rounded-full ${BAND_STYLES[k].bar}`} />{k}</span>)}
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-red-400" />Shared link / phone / username</span>
        </div>
      </div>
    </Card>
  );
}
