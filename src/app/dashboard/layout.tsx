"use client"

import { NavSidebar } from '@/components/dashboard/nav-sidebar';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const session = sessionStorage.getItem('tamer_admin_session');
    if (!isAdmin && session !== 'true') {
      router.push('/login');
    }
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {children}
      </main>
    </div>
  );
}