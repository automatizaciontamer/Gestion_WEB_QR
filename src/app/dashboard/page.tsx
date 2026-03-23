
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity, Loader2, ShieldCheck, Building2, Cloud } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Obra, Tarea } from '@/lib/types';
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
  
  const tareasQuery = useMemo(() => {
    if (!db) return null;
    return collection(db, 'tareas');
  }, [db]);

  const { data: obras, loading: loadingObras } = useCollection<Obra>(obrasQuery as any);
  const { data: clients, loading: loadingClients } = useCollection(clientsQuery as any);
  const { data: recentObras } = useCollection<Obra>(recentObrasQuery as any);
  const { data: allTareas, loading: loadingTareas } = useCollection<Tarea>(tareasQuery as any);


  const efficiency = useMemo(() => {
    if (!allTareas || allTareas.length === 0) return '0%';
    
    // Filtrar tareas que son de este usuario (o todas si es admin) y que están finalizadas
    const finished = allTareas.filter(t => 
      (isAdmin || t.usuarioAsignadoId === user?.id) && 
      t.estado === 'finalizada' && 
      t.totalHorasEfectivas
    );
    
    if (finished.length === 0) return '---';

    const scores = finished.map(t => {
      const ratio = t.tiempoDestinado / (t.totalHorasEfectivas || 1);
      return Math.min(100, ratio * 100);
    });

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return `${average.toFixed(0)}%`;
  }, [allTareas, isAdmin, user?.id]);

  const stats = [
    { name: 'Obras Activas', value: obras?.length || '0', icon: Construction, color: 'text-blue-600', bg: 'bg-blue-100', loading: loadingObras },
    {
      name: 'Eficiencia Global',
      value: efficiency,
      icon: Activity,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      loading: loadingTareas
    },
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
  ].filter(s => !s.hide);


  return (
    <div className="relative min-h-screen space-y-8 pt-10 lg:pt-0 overflow-hidden pb-20">

      <div
        className="relative w-full bg-white rounded-[3.5rem] p-8 sm:p-20 shadow-2xl shadow-blue-900/5 border border-white overflow-hidden flex flex-col items-center justify-center text-center min-h-[450px]"
        style={{
          backgroundImage: empresa?.logoUrl ? `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url("${empresa.logoUrl}")` : 'none',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="relative z-10 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-3 bg-[#0a3d62]/10 px-6 py-2 rounded-full border border-[#0a3d62]/20 mb-2">
            <Building2 className="w-4 h-4 text-[#0a3d62]" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#0a3d62]">SISTEMA DE GESTIÓN v5.2.0</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black text-[#0a3d62] leading-tight tracking-tighter uppercase drop-shadow-sm">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h2>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
          </div>

          <p className="text-xs sm:text-base text-muted-foreground font-black max-w-3xl mx-auto uppercase tracking-[0.3em] opacity-80">
            {empresa?.direccion || 'Ingeniería e Instalaciones Industriales'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <div className="flex flex-col items-center bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-[#0a3d62]/5 shadow-sm">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1 opacity-60">NIT / CUIL</span>
              <span className="text-lg font-black text-[#0a3d62]">{empresa?.nit || '30707867309'}</span>
            </div>
            <div className="flex flex-col items-center bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-[#0a3d62]/5 shadow-sm">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1 opacity-60">PORTAL OFICIAL</span>
              <span className="text-lg font-black text-primary uppercase tracking-tighter">
                {empresa?.web ? empresa.web.replace('https://', '').replace('http://', '').split('/')[0] : 'tamer.com.ar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 px-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-4 text-[#0a3d62]">
            ¡Hola, {user?.nombre?.split(' ')[0] || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] mt-1">Conexión Segura Tamer Cloud | v5.2.0</p>
        </div>
        {isAdmin && (
          <div className="bg-[#0a3d62] text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#0a3d62]/20">
            <ShieldCheck className="w-5 h-5" /> Acceso Administrador
          </div>
        )}
      </div>

      <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-xl overflow-hidden rounded-[2.5rem] bg-white transition-all hover:translate-y-[-4px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">{stat.name}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black tracking-tight text-[#0a3d62]">
                {stat.loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-[0.1em] text-[#0a3d62] flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> Proyectos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-4">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-5 bg-secondary/10 rounded-2xl hover:bg-secondary/20 transition-all cursor-pointer group border border-transparent hover:border-[#0a3d62]/10">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-base text-[#0a3d62] truncate group-hover:text-primary transition-colors">{obra.nombreObra}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase truncate tracking-widest">{obra.cliente}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black font-mono text-white bg-primary px-4 py-2 rounded-xl shadow-sm">
                        OF {obra.numeroOF}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-40">
                Aguardando nuevos registros.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[3rem] bg-[#0a3d62] text-white relative overflow-hidden group">
          <CardHeader className="p-8 relative z-10">
            <CardTitle className="text-lg font-black uppercase tracking-[0.2em] opacity-90 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-primary" /> Conectividad Cloud
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Enlace Directo QR Activo</span>
            </div>

            <div className="space-y-6">
              <p className="text-[11px] text-white/70 leading-relaxed font-bold uppercase tracking-wider">
                Acceso optimizado: Los códigos QR direccionan directamente al visor técnico de cada obra.
              </p>

              <div className="pt-6 border-t border-white/10">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-4">Identidad Corporativa v5.2.0</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg overflow-hidden">
                    {empresa?.logoUrl ? (
                      <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="text-[#0a3d62] w-10 h-10" />
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black truncate text-white uppercase tracking-tight">{empresa?.nombre || 'Tamer Industrial S.A.'}</p>
                    <p className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase">{empresa?.nit || '30707867309'}</p>
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
