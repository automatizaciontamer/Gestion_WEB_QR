
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity, Loader2, ShieldCheck, Building2 } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Obra } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const db = useFirestore();
  const { isAdmin, user, empresa } = useAuth();

  const obrasQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'obras');
  }, [db]);

  const clientsQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'usuarios_clientes');
  }, [db]);

  const recentObrasQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'obras'), orderBy('createdAt', 'desc'), limit(5));
  }, [db]);

  const { data: obras, loading: loadingObras } = useCollection<Obra>(obrasQuery);
  const { data: clients, loading: loadingClients } = useCollection(clientsQuery);
  const { data: recentObras } = useCollection<Obra>(recentObrasQuery);

  const stats = [
    { name: 'Obras Activas', value: obras?.length || '0', icon: Construction, color: 'text-blue-600', bg: 'bg-blue-100', loading: loadingObras },
    { 
      name: 'Usuarios Habilitados', 
      value: isAdmin ? (clients?.length || '0') : '...', 
      icon: Users, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100', 
      loading: loadingClients,
      hide: !isAdmin 
    },
    { name: 'Archivos Técnicos', value: '...', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Revisiones Mensuales', value: '...', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  ].filter(s => !s.hide);

  return (
    <div className="relative min-h-[calc(100vh-100px)] space-y-8 pt-10 lg:pt-0 overflow-hidden pb-20">
      
      {/* Cabecera Institucional Dinámica v2.8 */}
      <div className="relative w-full bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-blue-900/5 border border-white overflow-hidden flex flex-col items-center justify-center text-center min-h-[300px]">
        {/* Logo de Fondo Detrás del Texto (Watermark Superior) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none z-0">
          {empresa?.logoUrl && (
            <img 
              src={empresa.logoUrl} 
              alt="Background Logo" 
              className="w-[400px] sm:w-[600px] object-contain transition-all duration-1000"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>
        
        {/* Contenido Superior */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#0a3d62]/5 px-4 py-1.5 rounded-full border border-[#0a3d62]/10 mb-4">
            <Building2 className="w-3 h-3 text-[#0a3d62]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0a3d62]">Portal Institucional v2.8</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-[#0a3d62] leading-none tracking-tighter uppercase drop-shadow-sm">
            {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
          </h2>
          <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          <p className="text-sm sm:text-lg text-muted-foreground font-bold max-w-2xl mx-auto uppercase tracking-wider opacity-60">
            {empresa?.direccion || 'Gestión Técnica Avanzada'}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-[#0a3d62]">
            ¡Hola, {user?.nombre || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-medium">Estado del sistema de gestión Tamer Industrial | v2.8</p>
        </div>
        {isAdmin && (
          <div className="bg-[#0a3d62]/10 text-[#0a3d62] px-4 py-2 rounded-xl border border-[#0a3d62]/20 flex items-center gap-2 text-sm font-bold w-fit">
            <ShieldCheck className="w-4 h-4" /> Modo Administrador
          </div>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-xl shadow-gray-200/50 overflow-hidden rounded-[2rem] bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.name}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black flex items-center tracking-tighter text-[#0a3d62]">
                {stat.loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-[#0a3d62]">Últimas Obras Registradas</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-4">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-5 bg-secondary/20 rounded-[1.5rem] hover:bg-secondary/30 transition-all border border-transparent hover:border-primary/10">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-base text-[#0a3d62] truncate">{obra.nombreObra}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{obra.cliente}</span>
                    </div>
                    <span className="text-xs font-black font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-xl shrink-0">
                      {obra.numeroOF}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest text-xs opacity-50">
                No hay proyectos registrados recientemente.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-[#0a3d62] text-white">
          <CardHeader className="p-8">
            <CardTitle className="text-lg font-black uppercase tracking-[0.2em] opacity-80">Conectividad Cloud</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl backdrop-blur-sm border border-white/5">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
              <span className="text-sm font-black tracking-widest uppercase">Firestore Sincronizado</span>
            </div>
            <div className="space-y-6">
              <p className="text-xs text-white/60 leading-relaxed font-bold uppercase tracking-wider">
                Los cambios en planos y documentación técnica realizados aquí se reflejan instantáneamente en la App Android de campo y se respaldan en Google Drive.
              </p>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Identidad Institucional</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-2 shadow-xl overflow-hidden">
                    {empresa?.logoUrl ? (
                      <img 
                        src={empresa.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <Building2 className="text-[#0a3d62] w-8 h-8" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black truncate">{empresa?.nombre || 'Tamer Industrial S.A.'}</p>
                    <p className="text-[9px] font-black text-white/50 tracking-widest uppercase">{empresa?.nit || 'NIT PENDIENTE'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
