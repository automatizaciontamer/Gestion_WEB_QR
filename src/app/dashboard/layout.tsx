
"use client"

import { NavSidebar } from '@/components/dashboard/nav-sidebar';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isUser) {
      router.push('/login');
    }
  }, [isUser, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Sincronizando...</p>
      </div>
    );
  }

  if (!isUser) return null;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background overflow-hidden font-body">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
