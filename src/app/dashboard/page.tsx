
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity, Loader2, ShieldCheck, Building2, Cloud } from 'lucide-react';
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
    <div className="relative min-h-screen space-y-8 pt-10 lg:pt-0 overflow-hidden pb-20">
      
      {/* Cabecera Institucional v3.1.0 - Watermark Equilibrado */}
      <div className="relative w-full bg-white rounded-[3.5rem] p-8 sm:p-16 shadow-2xl shadow-blue-900/5 border border-white overflow-hidden flex flex-col items-center justify-center text-center min-h-[400px]">
        
        {/* Logo de Fondo Institucional (Marca de Agua con Opacidad Reforzada) */}
        {empresa?.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
            <img 
              src={empresa.logoUrl} 
              alt="Marca de Agua Institucional" 
              className="w-full max-w-[350px] sm:max-w-[600px] opacity-20 scale-100 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Contenido Frontal Superior */}
        <div className="relative z-10 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-3 bg-[#0a3d62]/5 px-6 py-2 rounded-full border border-[#0a3d62]/10 mb-2">
            <Building2 className="w-4 h-4 text-[#0a3d62]" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[#0a3d62]">GESTIÓN INSTITUCIONAL v3.1.0</span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-[#0a3d62] leading-tight tracking-tight uppercase">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h2>
            <div className="h-1.5 w-32 bg-primary mx-auto rounded-full" />
          </div>
          
          <p className="text-sm sm:text-lg text-muted-foreground font-bold max-w-3xl mx-auto uppercase tracking-[0.3em] opacity-70">
            {empresa?.direccion || 'Ingeniería e Instalaciones Industriales'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6">
            <div className="flex flex-col items-center bg-white/40 px-6 py-3 rounded-2xl border border-white">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">NIT</span>
              <span className="text-lg font-black text-[#0a3d62]">{empresa?.nit || '30707867309'}</span>
            </div>
            <div className="flex flex-col items-center bg-white/40 px-6 py-3 rounded-2xl border border-white">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em] mb-1">WEB</span>
              <span className="text-lg font-black text-primary uppercase tracking-tighter">
                {empresa?.web ? empresa.web.replace('https://', '').replace('http://', '').split('/')[0] : 'tamer.com.ar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-4 text-[#0a3d62]">
            ¡Hola, {user?.nombre?.split(' ')[0] || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] mt-1">Sincronización Cloud Tamer | v3.1.0</p>
        </div>
        {isAdmin && (
          <div className="bg-[#0a3d62] text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
            <ShieldCheck className="w-5 h-5" /> Administrador
          </div>
        )}
      </div>

      <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-[0.1em] text-[#0a3d62] flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> Historial de Obras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-4">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-5 bg-secondary/10 rounded-2xl hover:bg-secondary/20 transition-all cursor-pointer group">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-base text-[#0a3d62] truncate group-hover:text-primary">{obra.nombreObra}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase truncate">{obra.cliente}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black font-mono text-white bg-primary px-4 py-2 rounded-xl">
                        OF {obra.numeroOF}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-40">
                Aún no hay proyectos registrados.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl rounded-[3rem] bg-[#0a3d62] text-white relative overflow-hidden group">
          {empresa?.logoUrl && (
            <img 
              src={empresa.logoUrl} 
              alt="Fondo Card" 
              className="absolute -right-16 -bottom-16 w-64 opacity-10 pointer-events-none grayscale brightness-200"
            />
          )}
          
          <CardHeader className="p-8 relative z-10">
            <CardTitle className="text-lg font-black uppercase tracking-[0.2em] opacity-90 flex items-center gap-3">
              <Cloud className="w-5 h-5 text-primary" /> Conectividad Cloud
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Sincronización v3.1 Activa</span>
            </div>
            
            <div className="space-y-6">
              <p className="text-xs text-white/70 leading-relaxed font-bold uppercase tracking-wider">
                Gestión técnica de planos sincronizada en tiempo real con la App Android y respaldada en Google Drive.
              </p>
              
              <div className="pt-6 border-t border-white/10">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-4">Identidad Corporativa</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-3 shadow-lg overflow-hidden">
                    {empresa?.logoUrl ? (
                      <img 
                        src={empresa.logoUrl} 
                        alt="Empresa" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <Building2 className="text-[#0a3d62] w-10 h-10" />
                    )}
                  </div>
                  <div className="overflow-hidden space-y-1">
                    <p className="text-xl font-black truncate text-white">{empresa?.nombre || 'Tamer Industrial S.A.'}</p>
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
