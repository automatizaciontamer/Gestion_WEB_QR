"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction, Users, FileText, Activity } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { name: 'Obras Activas', value: '12', icon: Construction, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Clientes Registrados', value: '45', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Archivos Técnicos', value: '156', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Revisiones Mensuales', value: '28', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bienvenido, Administrador</h1>
        <p className="text-muted-foreground">Estado actual del sistema de gestión TamerWorks.</p>
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
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Últimas Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">No hay obras recientes para mostrar.</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Actividad del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Monitoreo de actividad sincronizada con App Android.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}