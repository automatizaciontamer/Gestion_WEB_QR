
"use client"

import { useState, useEffect } from 'react';
import { Building2, Save, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Empresa } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function EmpresaConfigPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<Empresa>({
    id: 'Empresa',
    nombre: '',
    direccion: '',
    nit: '',
    telefono: '',
    email: '',
    usuarioAdmin: '',
    passwordAdmin: '',
    logoUrl: '',
    web: ''
  });

  useEffect(() => {
    if (!isAdmin && !loading) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!db) return;
    const loadEmpresa = async () => {
      const docRef = doc(db, 'Configuracion', 'Empresa');
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setFormData({ ...snap.data(), id: snap.id } as Empresa);
        }
      } catch (error) {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
      } finally {
        setLoading(false);
      }
    };
    loadEmpresa();
  }, [db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);

    const docRef = doc(db, 'Configuracion', 'Empresa');
    setDoc(docRef, formData, { merge: true })
      .then(() => {
        toast({
          title: "Datos Actualizados",
          description: "La información institucional de Tamer Industrial S.A. ha sido guardada.",
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: formData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Cargando Configuración...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 pt-16 lg:pt-0 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0a3d62] flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Configuración de Empresa
          </h1>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
            Identidad Institucional (v2.2)
          </p>
        </div>
        <Button 
          onClick={handleSubmit}
          className="h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black px-8 shadow-xl shadow-primary/20 gap-3 transition-all active:scale-95"
          disabled={saving}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> GUARDAR DATOS</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-20">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-[#0a3d62]/5 border-b py-8">
            <CardTitle className="text-xl font-black text-[#0a3d62]">Ficha Institucional</CardTitle>
            <CardDescription className="font-bold">Datos para reportes y portal web.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Razón Social</Label>
                  <Input 
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="Tamer Industrial S.A."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">NIT / CUIL</Label>
                  <Input 
                    value={formData.nit}
                    onChange={e => setFormData({...formData, nit: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="30707867309"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dirección Fiscal</Label>
                <Input 
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                  className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                  placeholder="Julio A. Roca 1899 Benegas Godoy Cruz"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Teléfono</Label>
                  <Input 
                    value={formData.telefono}
                    onChange={e => setFormData({...formData, telefono: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="2615566911"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email de Contacto</Label>
                  <Input 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="automatizacion.tamer@gmail.com"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Sitio Web Oficial</Label>
                <Input 
                  value={formData.web}
                  onChange={e => setFormData({...formData, web: e.target.value})}
                  className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                  placeholder="https://tamer.com.ar"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Upload className="w-3 h-3" /> Logo Institucional (URL)
                </Label>
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-secondary/10 p-6 rounded-3xl">
                  <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner p-2">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="text-muted-foreground w-12 h-12" />
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">URL Directa del Logo</p>
                    <Input 
                      value={formData.logoUrl}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" 
                      placeholder="Pegue la URL del logo de Drive o Web"
                    />
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
