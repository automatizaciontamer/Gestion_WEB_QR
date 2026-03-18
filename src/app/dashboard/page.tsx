
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
      
      {/* Cabecera Institucional v2.9.5 con Visibilidad Mejorada */}
      <div className="relative w-full bg-white rounded-[3rem] p-8 sm:p-20 shadow-2xl shadow-blue-900/10 border border-white overflow-hidden flex flex-col items-center justify-center text-center min-h-[450px]">
        
        {/* Logo de Fondo Institucional (Marca de Agua con Alta Visibilidad) */}
        {empresa?.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <img 
              src={empresa.logoUrl} 
              alt="Logo Marca de Agua" 
              className="w-[400px] sm:w-[700px] opacity-[0.25] scale-125 object-contain transition-all duration-1000"
              style={{ filter: 'drop-shadow(0 0 20px rgba(10, 61, 98, 0.1))' }}
            />
          </div>
        )}
        
        {/* Contenido Frontal Superior */}
        <div className="relative z-10 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-3 bg-[#0a3d62]/10 px-8 py-3 rounded-full border border-[#0a3d62]/20 mb-4 backdrop-blur-md">
            <Building2 className="w-5 h-5 text-[#0a3d62]" />
            <span className="text-[12px] font-black uppercase tracking-[0.5em] text-[#0a3d62]">SISTEMA DE GESTIÓN v2.9.5</span>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-5xl sm:text-8xl font-black text-[#0a3d62] leading-none tracking-tighter uppercase drop-shadow-xl">
              {empresa?.nombre || 'TAMER INDUSTRIAL S.A.'}
            </h2>
            <div className="h-2.5 w-48 bg-primary mx-auto rounded-full shadow-lg" />
          </div>
          
          <p className="text-sm sm:text-2xl text-muted-foreground font-black max-w-3xl mx-auto uppercase tracking-[0.3em] opacity-90">
            {empresa?.direccion || 'Ingeniería e Instalaciones Industriales'}
          </p>

          <div className="flex items-center justify-center gap-8 pt-6">
            <div className="flex flex-col items-center bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-sm border">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">CUIL / NIT</span>
              <span className="text-lg font-black text-[#0a3d62]">{empresa?.nit || '30707867309'}</span>
            </div>
            <div className="flex flex-col items-center bg-white/50 px-6 py-3 rounded-2xl backdrop-blur-sm shadow-sm border">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SITIO WEB</span>
              <span className="text-lg font-black text-primary">{empresa?.web ? empresa.web.replace('https://', '') : 'tamer.com.ar'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-[#0a3d62]">
            ¡Hola, {user?.nombre || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] font-black">Estado del Sistema Tamer | Sincronización v2.9.5</p>
        </div>
        {isAdmin && (
          <div className="bg-[#0a3d62] text-white px-6 py-3 rounded-2xl border border-[#0a3d62]/20 flex items-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-[#0a3d62]/20">
            <ShieldCheck className="w-5 h-5" /> Acceso Administrador
          </div>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-xl shadow-gray-200/50 overflow-hidden rounded-[2.5rem] bg-white transition-transform hover:scale-[1.02]">
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
        <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 p-8">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-[#0a3d62] flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" /> Últimas Obras Registradas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-4">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-5 bg-secondary/20 rounded-[1.8rem] hover:bg-secondary/30 transition-all border border-transparent hover:border-primary/20 cursor-pointer group">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-black text-base text-[#0a3d62] truncate group-hover:text-primary transition-colors">{obra.nombreObra}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate">{obra.cliente}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-primary bg-primary/10 px-4 py-2 rounded-xl">
                        {obra.numeroOF}
                      </span>
                    </div>
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
        
        <Card className="border-none shadow-2xl rounded-[3rem] bg-[#0a3d62] text-white relative overflow-hidden group">
          {/* Logo Sutil en el fondo de la card de conectividad */}
          {empresa?.logoUrl && (
            <img 
              src={empresa.logoUrl} 
              alt="Logo Fondo Card" 
              className="absolute -right-20 -bottom-20 w-80 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700"
            />
          )}
          
          <CardHeader className="p-8 relative z-10">
            <CardTitle className="text-lg font-black uppercase tracking-[0.2em] opacity-80">Conectividad Cloud</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]"></div>
              <span className="text-sm font-black tracking-widest uppercase">Firestore Sincronizado v2.9.5</span>
            </div>
            
            <div className="space-y-6">
              <p className="text-xs text-white/70 leading-relaxed font-bold uppercase tracking-wider">
                La plataforma gestiona planos y documentación técnica sincronizada en tiempo real con la App Android de campo y respaldada en Google Drive.
              </p>
              
              <div className="pt-8 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4">Identidad Corporativa</p>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center p-3 shadow-2xl overflow-hidden border-2 border-white/20">
                    {empresa?.logoUrl ? (
                      <img 
                        src={empresa.logoUrl} 
                        alt="Logo Empresa" 
                        className="w-full h-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : (
                      <Building2 className="text-[#0a3d62] w-10 h-10" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-lg font-black truncate drop-shadow-sm">{empresa?.nombre || 'Tamer Industrial S.A.'}</p>
                    <p className="text-[10px] font-black text-white/50 tracking-[0.2em] uppercase">{empresa?.nit || '30707867309'}</p>
                    <p className="text-[9px] font-bold text-primary-foreground/40 mt-1 uppercase">Sincronización Cloud Activa</p>
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
