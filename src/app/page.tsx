
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const session = sessionStorage.getItem('tamer_session');
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-xl"></div>
        <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Iniciando Tamer Cloud v5.0.0...</p>
      </div>
    </div>
  );
}
