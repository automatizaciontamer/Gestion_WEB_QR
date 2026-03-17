"use client"

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity, Loader2 } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Obra } from '@/lib/types';

export default function DashboardPage() {
  const db = useFirestore();

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
    { name: 'Clientes Registrados', value: clients?.length || '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100', loading: loadingClients },
    { name: 'Archivos Técnicos', value: '...', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Revisiones Mensuales', value: '...', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Administrador</h1>
        <p className="text-muted-foreground">Estado actual del sistema de gestión Tamer Industrial S.A..</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.name}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center">
                {stat.loading ? <Loader2 className="w-6 h-6 animate-spin" /> : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Últimas Obras Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            {recentObras && recentObras.length > 0 ? (
              <div className="space-y-4">
                {recentObras.map(obra => (
                  <div key={obra.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{obra.nombreObra}</span>
                      <span className="text-xs text-muted-foreground">{obra.cliente}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">{obra.numeroOF}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No hay obras recientes para mostrar.</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Conexión con Firestore activa.</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
              Los cambios realizados aquí se reflejan instantáneamente en la aplicación Android de Tamer Industrial S.A. para los supervisores y clientes en campo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
