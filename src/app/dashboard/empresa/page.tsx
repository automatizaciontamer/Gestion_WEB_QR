
"use client"

import { useState, useEffect } from 'react';
import { Building2, Save, Loader2, Key, Eye, EyeOff, Mail, Phone, MapPin, Hash, Settings, Globe } from 'lucide-react';
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

export default function EmpresaConfigPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<Empresa>({
    id: 'CONFIGURACION',
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
    if (!db) return;
    const loadEmpresa = async () => {
      const docRef = doc(db, 'config', 'CONFIGURACION');
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

    const dataToSave = {
      ...formData,
      usuarioAdmin: formData.usuarioAdmin.toLowerCase().trim()
    };

    const docRef = doc(db, 'config', 'CONFIGURACION');
    setDoc(docRef, dataToSave, { merge: true })
      .then(() => {
        toast({
          title: "Datos Actualizados",
          description: "La información institucional ha sido guardada con éxito.",
        });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: dataToSave,
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

  return (
    <div className="space-y-8 pt-16 lg:pt-0 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#0a3d62] flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          Datos de Empresa
        </h1>
        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">
          Identidad Institucional y Acceso Maestro (Sincronizado con Android)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-[#0a3d62]/5 border-b py-8">
            <CardTitle className="text-xl font-black text-[#0a3d62]">Información General</CardTitle>
            <CardDescription className="font-bold">Datos institucionales para reportes y QR.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Nombre / Razón Social
                  </Label>
                  <Input 
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="Tamer Industrial S.A."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Hash className="w-3 h-3" /> NIT / CUIL
                  </Label>
                  <Input 
                    value={formData.nit}
                    onChange={e => setFormData({...formData, nit: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="30707867309"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Dirección
                </Label>
                <Input 
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                  className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                  placeholder="Dirección fiscal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Teléfono
                  </Label>
                  <Input 
                    value={formData.telefono}
                    onChange={e => setFormData({...formData, telefono: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="2615566911"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Público
                  </Label>
                  <Input 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                    placeholder="info@tamer.com"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Sitio Web
                </Label>
                <Input 
                  value={formData.web}
                  onChange={e => setFormData({...formData, web: e.target.value})}
                  className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                  placeholder="https://tamer.com.ar"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Settings className="w-3 h-3" /> URL Logo
                </Label>
                <Input 
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  className="h-12 rounded-xl bg-secondary/20 border-none font-bold" 
                  placeholder="URL de la imagen del logo"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-[#0a3d62] text-white">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-widest">Acceso Maestro</CardTitle>
              <CardDescription className="text-white/60 font-medium">Credenciales para acceso total al sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Usuario Administrador</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    value={formData.usuarioAdmin}
                    onChange={e => setFormData({...formData, usuarioAdmin: e.target.value})}
                    className="pl-12 h-14 rounded-2xl bg-white/10 border-none text-white font-bold" 
                    placeholder="admin@tamer.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Clave de Administrador</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={formData.passwordAdmin}
                    onChange={e => setFormData({...formData, passwordAdmin: e.target.value})}
                    className="pl-12 pr-12 h-14 rounded-2xl bg-white/10 border-none text-white font-bold" 
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSubmit}
            className="w-full h-16 bg-primary hover:bg-primary/90 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 gap-3"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> GUARDAR DATOS</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
