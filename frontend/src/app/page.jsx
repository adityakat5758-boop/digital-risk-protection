'use client';
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/components/AppContext';
import Landing from '@/components/Landing';
import Scanning from '@/components/Scanning';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Profiles from '@/components/Profiles';
import ProfileDrawer from '@/components/ProfileDrawer';
import ScamAnalyzer from '@/components/ScamAnalyzer';
import AppChecker from '@/components/AppChecker';
import { Footer, PageSkeleton } from '@/components/common';

const VIEWS = { dashboard: Dashboard, profiles: Profiles, scam: ScamAnalyzer, apps: AppChecker };

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
          {data && (loading ? <PageSkeleton /> : <View />)}
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
