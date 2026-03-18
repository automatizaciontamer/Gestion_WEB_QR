
"use client"

import { useState, useEffect, useRef } from 'react';
import { Building2, Loader2, Upload, Globe, Phone, Mail, FileCheck, CloudUpload, Info } from 'lucide-react';
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
    web: ''
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
        setFormData({ ...snap.data(), id: snap.id } as Empresa);
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
        description: "Los datos institucionales y el logo se han actualizado en todo el sistema.",
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
          onClick={handleSubmit}
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
            
            {/* Sección de Logo */}
            <div className="space-y-6">
              <Label className="text-[12px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                <Upload className="w-4 h-4" /> Logotipo Institucional (Sincronizado Drive)
              </Label>
              <div className="flex flex-col lg:flex-row gap-10 items-center bg-gray-50 p-10 rounded-[3rem] border-2 border-dashed border-[#0a3d62]/10 transition-all hover:bg-gray-100">
                <div className="w-56 h-56 bg-white rounded-[2.5rem] flex items-center justify-center overflow-hidden border-8 border-white shadow-2xl p-4 shrink-0 relative group">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Empresa" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="text-muted-foreground/20 w-20 h-20" />
                  )}
                  <div className="absolute inset-0 bg-[#0a3d62]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" className="text-white font-black text-xs" onClick={() => fileInputRef.current?.click()}>CAMBIAR</Button>
                  </div>
                </div>
                
                <div className="flex-1 w-full space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-black text-[#0a3d62] uppercase tracking-wider">Carga Automática de Identidad</p>
                    <div className="flex flex-wrap gap-4">
                      <Button 
                        variant="outline" 
                        className="rounded-2xl font-black border-2 border-[#0a3d62] text-[#0a3d62] hover:bg-[#0a3d62] hover:text-white h-14 px-8 shadow-lg"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? <Loader2 className="animate-spin mr-3" /> : <Upload className="w-5 h-5 mr-3" />}
                        SUBIR DESDE ESTE DISPOSITIVO
                      </Button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Enlace Institucional Sincronizado</p>
                    <Input 
                      value={formData.logoUrl}
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                      className="h-14 rounded-2xl bg-white border-none font-bold shadow-md text-primary" 
                      placeholder="URL del logo (gestionado por Drive v2.9)"
                    />
                    <p className="text-[9px] font-bold text-muted-foreground/60 italic">Este enlace se genera automáticamente al subir el archivo.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Datos Fiscales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Razón Social
                </Label>
                <Input 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-xl text-[#0a3d62]" 
                  placeholder="TAMER INDUSTRIAL S.A."
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5" /> CUIL / NIT
                </Label>
                <Input 
                  value={formData.nit}
                  onChange={e => setFormData({...formData, nit: e.target.value})}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-black text-xl text-[#0a3d62]" 
                  placeholder="30707867309"
                  required
                />
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Dirección Fiscal / Operativa</Label>
                <Input 
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
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
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
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
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="h-14 rounded-2xl bg-secondary/30 border-none font-bold text-lg text-[#0a3d62]" 
                  placeholder="automatizacion.tamer@gmail.com"
                />
              </div>
              <div className="space-y-3 md:col-span-2 pt-6 border-t">
                <Label className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Portal Web Oficial
                </Label>
                <Input 
                  value={formData.web}
                  onChange={e => setFormData({...formData, web: e.target.value})}
                  className="h-14 rounded-2xl bg-primary/10 border-none font-black text-lg text-[#0a3d62]" 
                  placeholder="https://tamer.com.ar"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
