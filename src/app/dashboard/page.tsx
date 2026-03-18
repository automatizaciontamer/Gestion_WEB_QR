
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
      
      {/* Cabecera Institucional v3.0.0 - Watermark Reforzado */}
      <div className="relative w-full bg-white rounded-[3.5rem] p-8 sm:p-24 shadow-2xl shadow-blue-900/10 border border-white overflow-hidden flex flex-col items-center justify-center text-center min-h-[500px]">
        
        {/* Logo de Fondo Institucional (Marca de Agua con Visibilidad Garantizada) */}
        {empresa?.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
            <img 
              src={empresa.logoUrl} 
              alt="Marca de Agua Institucional" 
              className="w-full max-w-[450px] sm:max-w-[750px] opacity-[0.35] scale-110 object-contain transition-all duration-700"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Contenido Frontal Superior (z-index alto para estar sobre el logo) */}
        <div className="relative z-10 space-y-10 max-w-5xl">
          <div className="inline-flex items-center gap-4 bg-[#0a3d62]/10 px-10 py-4 rounded-full border border-[#0a3d62]/20 mb-4 backdrop-blur-xl">
            <Building2 className="w-6 h-6 text-[#0a3d62]" />
            <span className="text-[14px] font-black uppercase tracking-[0.6em] text-[#0a3d62]">SISTEMA DE GESTIÓN v3.0.0</span>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-6xl sm:text-9xl font-black text-[#0a3d62] leading-none tracking-tighter uppercase drop-shadow-2xl">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h2>
            <div className="h-3 w-64 bg-primary mx-auto rounded-full shadow-2xl" />
          </div>
          
          <p className="text-lg sm:text-3xl text-muted-foreground font-black max-w-4xl mx-auto uppercase tracking-[0.4em] opacity-80 leading-relaxed">
            {empresa?.direccion || 'Ingeniería e Instalaciones Industriales'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-10 pt-10">
            <div className="flex flex-col items-center bg-white/60 px-10 py-5 rounded-[2rem] backdrop-blur-md shadow-xl border border-white">
              <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">CUIL / NIT</span>
              <span className="text-2xl font-black text-[#0a3d62]">{empresa?.nit || '30707867309'}</span>
            </div>
            <div className="flex flex-col items-center bg-white/60 px-10 py-5 rounded-[2rem] backdrop-blur-md shadow-xl border border-white">
              <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">PORTAL WEB</span>
              <span className="text-2xl font-black text-primary uppercase tracking-tighter">{empresa?.web ? empresa.web.replace('https://', '').replace('http://', '') : 'tamer.com.ar'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 text-[#0a3d62]">
            ¡Hola, {user?.nombre || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[12px] mt-2">Sincronización Cloud Tamer | Versión Estable v3.0.0</p>
        </div>
        {isAdmin && (
          <div className="bg-[#0a3d62] text-white px-8 py-4 rounded-[2rem] border border-[#0a3d62]/20 flex items-center gap-4 text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#0a3d62]/30">
            <ShieldCheck className="w-6 h-6" /> Panel Administrador
          </div>
        )}
      </div>

      <div className="relative z-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-2xl shadow-[#0a3d62]/5 overflow-hidden rounded-[3rem] bg-white transition-all hover:scale-[1.05] hover:shadow-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.name}</CardTitle>
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black flex items-center tracking-tighter text-[#0a3d62]">
                {stat.loading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        <Card className="border-none shadow-2xl shadow-[#0a3d62]/5 rounded-[3.5rem] bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 p-10">
            <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-[#0a3d62] flex items-center gap-4">
              <Activity className="w-6 h-6 text-primary" /> Historial de Obras
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-6">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-6 bg-secondary/20 rounded-[2.2rem] hover:bg-secondary/40 transition-all border border-transparent hover:border-primary/20 cursor-pointer group shadow-sm">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-lg text-[#0a3d62] truncate group-hover:text-primary transition-colors">{obra.nombreObra}</span>
                      <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] truncate mt-1">{obra.cliente}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-white bg-primary px-5 py-2.5 rounded-2xl shadow-lg shadow-primary/20">
                        OF {obra.numeroOF}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 text-muted-foreground font-black uppercase tracking-[0.3em] text-xs opacity-40">
                Aún no hay proyectos registrados.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-[#0a3d62] text-white relative overflow-hidden group">
          {/* Fondo sutil de logo en card */}
          {empresa?.logoUrl && (
            <img 
              src={empresa.logoUrl} 
              alt="Logo Fondo Card" 
              className="absolute -right-24 -bottom-24 w-96 opacity-[0.15] pointer-events-none group-hover:scale-110 transition-transform duration-1000 grayscale brightness-200"
            />
          )}
          
          <CardHeader className="p-10 relative z-10">
            <CardTitle className="text-xl font-black uppercase tracking-[0.3em] opacity-90 flex items-center gap-4">
              <Cloud className="w-6 h-6 text-primary" /> Conectividad Cloud
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-10 relative z-10">
            <div className="flex items-center gap-5 bg-white/10 p-6 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.8)]"></div>
              <span className="text-sm font-black tracking-[0.2em] uppercase">Sincronización v3.0 Activa</span>
            </div>
            
            <div className="space-y-8">
              <p className="text-sm text-white/70 leading-relaxed font-bold uppercase tracking-widest">
                Gestión técnica de planos sincronizada en tiempo real con la App Android y respaldada en Google Drive para operaciones de campo.
              </p>
              
              <div className="pt-10 border-t border-white/10">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-6">Identidad Institucional Sincronizada</p>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center p-4 shadow-2xl overflow-hidden border-4 border-white/10">
                    {empresa?.logoUrl ? (
                      <img 
                        src={empresa.logoUrl} 
                        alt="Identidad Corporativa" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <Building2 className="text-[#0a3d62] w-12 h-12" />
                    )}
                  </div>
                  <div className="overflow-hidden space-y-2">
                    <p className="text-2xl font-black truncate drop-shadow-xl text-white">{empresa?.nombre || 'Tamer Industrial S.A.'}</p>
                    <p className="text-[12px] font-black text-white/60 tracking-[0.3em] uppercase">{empresa?.nit || '30707867309'}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                      Base de Datos Sincronizada
                    </div>
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
