
"use client"

import { useState, useEffect, useRef } from 'react';
import { Building2, Loader2, Upload, Globe, Phone, Mail, FileCheck, CloudUpload, Info, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Empresa } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { uploadToDrive } from '@/lib/drive-api';
import { DEFAULT_HORARIOS } from '@/lib/time-utils';


export default function EmpresaConfigPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    web: '',
    claveAccesoInfo: ''
  });

  useEffect(() => {
    if (!isAdmin && !loading) {
      router.push('/dashboard');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!db) return;

    const docRef = doc(db, 'Configuracion', 'Empresa');

    // Escucha en tiempo real para la configuración de empresa v2.9
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setFormData({ 
          ...data, 
          id: snap.id,
          horarios: data.horarios || DEFAULT_HORARIOS 
        } as Empresa);
      } else {
        setFormData(prev => ({ ...prev, horarios: DEFAULT_HORARIOS }));
      }
      setLoading(false);
    }, (error) => {

      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadToDrive(file, "Datos Empresa");

      // Automatización de URL directa v2.9
      if (result && result.fileId) {
        const driveUrl = `https://drive.google.com/uc?id=${result.fileId}&export=download`;
        setFormData(prev => ({ ...prev, logoUrl: driveUrl }));

        toast({
          title: "Logo Cargado en Drive",
          description: "La imagen se ha vinculado correctamente. Guarde los cambios para aplicar.",
        });
      } else {
        toast({
          title: "Archivo Enviado",
          description: "El logo se subió a Drive. Si no ve la imagen, verifique el permiso del archivo.",
        });
      }
    } catch (error) {
      toast({
        title: "Error de Subida",
        description: "No se pudo conectar con el servicio de Drive.",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);

    try {
      const docRef = doc(db, 'Configuracion', 'Empresa');

      // Guardar en Firestore con merge para no sobreescribir otros campos si existen
      await setDoc(docRef, {
        ...formData,
        updatedAt: Date.now()
      }, { merge: true });

      // Respaldo asíncrono en Drive
      const configBlob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
      const configFile = new File([configBlob], "config_empresa.json", { type: 'application/json' });
      uploadToDrive(configFile, "Datos Empresa").catch(() => null);

      toast({
        title: "Sincronización v2.9 Exitosa",
        description: "Los datos institucionales se han actualizado en todo el sistema.",
      });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: 'Configuracion/Empresa',
        operation: 'write',
        requestResourceData: formData,
      });
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-[#0a3d62]" />
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Conectando con Identidad Institucional...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 pt-16 lg:pt-0 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#0a3d62] flex items-center gap-4">
            <Building2 className="w-10 h-10 text-primary" />
            Identidad Corporativa
          </h1>
          <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">
            Gestión Institucional Tamer Industrial v2.9
          </p>
        </div>
        <Button
          type="submit"
          form="empresa-form"
          className="h-16 bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-3xl font-black px-10 shadow-2xl shadow-[#0a3d62]/20 gap-3 transition-all active:scale-95"
          disabled={saving}
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CloudUpload className="w-6 h-6" /> GUARDAR IDENTIDAD</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden">
          <CardHeader className="bg-secondary/20 border-b p-10">
            <div className="flex items-center gap-4 mb-2">
              <Info className="w-5 h-5 text-primary" />
              <CardTitle className="text-2xl font-black text-[#0a3d62]">Ficha Institucional v2.9</CardTitle>
            </div>
            <CardDescription className="text-base font-medium">
              El logo cargado se aplicará automáticamente como fondo institucional (watermark) en el panel principal y visor de obras.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-12">

            <form id="empresa-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Razón Social
                </Label>
                <Input
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-xl text-[#0a3d62]"
                  placeholder="TAMER INDUSTRIAL S.A."
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5" /> CUIT
                </Label>
                <Input
                  value={formData.nit}
                  onChange={e => setFormData({ ...formData, nit: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-xl text-[#0a3d62]"
                  placeholder="30707867309"
                  required
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Dirección Fiscal / Operativa</Label>
                <Input
                  value={formData.direccion}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]"
                  placeholder="Julio A. Roca 1899 Benegas Godoy Cruz"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Teléfono de Contacto
                </Label>
                <Input
                  value={formData.telefono}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]"
                  placeholder="2615566911"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Corporativo
                </Label>
                <Input
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]"
                  placeholder="automatizacion.tamer@gmail.com"
                />
              </div>
              <div className="space-y-3 pt-6 border-t">
                <Label className="text-[11px] font-black uppercase tracking-widest text-[#0a3d62] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Usuario Administrador (Dashboard)
                </Label>
                <Input
                  value={formData.usuarioAdmin}
                  onChange={e => setFormData({ ...formData, usuarioAdmin: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]"
                  placeholder="Ej: admin"
                  required
                />
              </div>
              <div className="space-y-3 pt-6 border-t">
                <Label className="text-[11px] font-black uppercase tracking-widest text-[#0a3d62] flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Clave Administrador
                </Label>
                <Input
                  value={formData.passwordAdmin}
                  onChange={e => setFormData({ ...formData, passwordAdmin: e.target.value })}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]"
                  placeholder="Ej: 14569"
                  required
                />
              </div>
              <div className="space-y-3 md:col-span-2 pt-6 border-t">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> CLAVE Acceso Informacion (Maestra Visor QR):
                </Label>
                <Input
                  value={formData.claveAccesoInfo || ''}
                  onChange={e => setFormData({ ...formData, claveAccesoInfo: e.target.value })}
                  className="h-14 rounded-2xl bg-blue-50 border-none font-black text-lg text-primary"
                  placeholder="Contraseña Maestra para descargar en Visor de Obras"
                  required
                />
              </div>
              <div className="space-y-3 md:col-span-2 pt-6 border-t">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Portal Web Oficial
                </Label>
                <Input
                  value={formData.web}
                  onChange={e => setFormData({ ...formData, web: e.target.value })}
                  className="h-14 rounded-2xl bg-primary/10 border-none font-black text-lg text-[#0a3d62]"
                  placeholder="https://tamer.com.ar"
                />
              </div>
            </form>
          </CardContent>
        </Card>

        {/* --- NUEVA SECCIÓN: HORARIOS LABORALES --- */}
        <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden mt-8">
          <CardHeader className="bg-[#0a3d62] text-white p-10">
            <div className="flex items-center gap-4 mb-2">
              <Clock className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Horarios Laborales</CardTitle>
            </div>
            <CardDescription className="text-white/70 font-bold uppercase tracking-widest text-[10px]">
              Configuración para cálculo de Tiempos Efectivos en Tareas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.horarios && Object.entries(formData.horarios).map(([dia, config]) => (
                <div key={dia} className="p-6 bg-secondary/20 rounded-[2rem] space-y-4 border border-transparent hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#0a3d62] uppercase tracking-widest text-sm">{dia}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={config.habilitado}
                        onChange={e => {
                          const newHorarios = { ...formData.horarios };
                          newHorarios[dia as keyof typeof formData.horarios] = { ...config, habilitado: e.target.checked };
                          setFormData({ ...formData, horarios: newHorarios as any });
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  {config.habilitado ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Desde</Label>
                        <Input 
                          type="time" 
                          value={config.desde}
                          onChange={e => {
                            const newHorarios = { ...formData.horarios };
                            newHorarios[dia as keyof typeof formData.horarios] = { ...config, desde: e.target.value };
                            setFormData({ ...formData, horarios: newHorarios as any });
                          }}
                          className="h-10 rounded-xl bg-white border-none text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Hasta</Label>
                        <Input 
                          type="time" 
                          value={config.hasta}
                          onChange={e => {
                            const newHorarios = { ...formData.horarios };
                            newHorarios[dia as keyof typeof formData.horarios] = { ...config, hasta: e.target.value };
                            setFormData({ ...formData, horarios: newHorarios as any });
                          }}
                          className="h-10 rounded-xl bg-white border-none text-xs font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-[52px] flex items-center justify-center bg-gray-100/50 rounded-xl border border-dashed border-gray-300">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin Atención</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

