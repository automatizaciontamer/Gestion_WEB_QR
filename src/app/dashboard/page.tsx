
"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity, Loader2, ShieldCheck } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Obra } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const db = useFirestore();
  const { isAdmin, user } = useAuth();

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
    <div className="space-y-8 pt-10 lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
            ¡Hola, {user?.nombre || 'Bienvenido'}!
          </h1>
          <p className="text-muted-foreground font-medium">Estado actual del sistema de gestión Tamer Industrial S.A..</p>
        </div>
        {isAdmin && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20 flex items-center gap-2 text-sm font-bold w-fit">
            <ShieldCheck className="w-4 h-4" /> Modo Administrador
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm overflow-hidden rounded-2xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">{stat.name}</CardTitle>
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black flex items-center tracking-tight">
                {stat.loading ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-primary">Últimas Obras Registradas</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-3">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl hover:bg-secondary/30 transition-colors border border-transparent hover:border-primary/10">
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-sm truncate">{obra.nombreObra}</span>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate">{obra.cliente}</span>
                    </div>
                    <span className="text-xs font-black font-mono text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                      {obra.numeroOF}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground font-medium">No hay obras recientes para mostrar.</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm rounded-2xl bg-[#0a3d62] text-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-[0.2em] opacity-80">Estado de Sincronización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
              <span className="text-sm font-bold tracking-wide">Base de Datos Firestore Conectada</span>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-white/70 leading-relaxed font-medium">
                Cualquier cambio técnico o administrativo realizado en este panel se refleja en tiempo real para los supervisores en campo y clientes finales.
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-2">Rol Actual</p>
                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {isAdmin ? 'ADMINISTRADOR DEL SISTEMA' : 'USUARIO AUTORIZADO'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
