'use client';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/components/AppContext';
import Landing, { BrandSearch } from '@/components/Landing';
import Scanning from '@/components/Scanning';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Profiles from '@/components/Profiles';
import ProfileDrawer from '@/components/ProfileDrawer';
import ScamAnalyzer from '@/components/ScamAnalyzer';
import AppChecker from '@/components/AppChecker';
import LinkScanner from '@/components/LinkScanner';
import { Button, Footer, PageSkeleton } from '@/components/common';
import { ArrowLeft } from 'lucide-react';

const VIEWS = { dashboard: Dashboard, profiles: Profiles, scam: ScamAnalyzer, apps: AppChecker, link: LinkScanner };

function TopBar() {
  const { goHome } = useApp();
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start">
      <Button data-testid="new-search-btn" variant="ghost" className="shrink-0 py-3" onClick={goHome}>
        <ArrowLeft className="h-4 w-4" /> New Search
      </Button>
      <div className="flex-1"><BrandSearch compact /></div>
    </div>
  );
}

function Shell() {
  const { status, view, data } = useApp();
  const key = `${view}-${status}`;
  const [shown, setShown] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => setShown(key), 450);
    return () => clearTimeout(t);
  }, [key]);
  const loading = shown !== key;
  if (status === 'idle') return <Landing />;
  const View = VIEWS[view];
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col md:ml-64">
        <div key={view} className="mx-auto w-full max-w-7xl flex-1 animate-fade-up px-5 py-8 md:px-10">
          <TopBar />
          {loading ? <PageSkeleton /> : data || view === 'scam' || view === 'link' ? <View /> : null}
        </div>
        <Footer />
      </main>
      <ProfileDrawer />
      {status === 'scanning' && <Scanning />}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
