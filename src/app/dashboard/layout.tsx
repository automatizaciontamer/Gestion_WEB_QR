
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
    <div className="flex flex-col lg:flex-row h-screen print:h-auto bg-background print:bg-white overflow-hidden print:overflow-visible font-body">
      <div className="print:hidden">
        <NavSidebar />
      </div>
      <main className="flex-1 overflow-y-auto print:overflow-visible p-4 sm:p-6 lg:p-8 print:p-0 no-scrollbar bg-[#f8fafc] print:bg-white">
        <div className="max-w-7xl mx-auto h-full print:h-auto print:max-w-none print:w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
