"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = sessionStorage.getItem('tamer_admin_session');
    if (session === 'true') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-xl"></div>
        <p className="text-muted-foreground font-medium">Cargando TamerWorks...</p>
      </div>
    </div>
  );
}