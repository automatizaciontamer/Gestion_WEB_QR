"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Upload,
  FileText,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { uploadToDrive } from '@/lib/drive-api';

export default function NewObraPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    numeroOF: '',
    numeroOT: '',
    codigoCliente: '',
    nombreObra: '',
    cliente: '',
    direccion: '',
    descripcion: '',
    usuarioAcceso: '',
    claveAcceso: '',
  });

  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      // In a real app, we would save to Firestore here.
      // We also upload files to Drive if any.
      const folderName = `${formData.codigoCliente}-${formData.numeroOF}-${formData.numeroOT}`;
      
      for (const file of files) {
        await uploadToDrive(file, folderName);
      }

      toast({
        title: "Obra creada exitosamente",
        description: `La obra ${formData.nombreObra} ha sido registrada.`,
      });
      router.push('/dashboard/obras');
    } catch (error) {
      toast({
        title: "Error al crear la obra",
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Obra</h1>
            <p className="text-sm text-muted-foreground">Complete los datos técnicos para registrar la obra.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Información Técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroOF">Número OF</Label>
                  <Input id="numeroOF" placeholder="OF-0000" value={formData.numeroOF} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroOT">Número OT</Label>
                  <Input id="numeroOT" placeholder="OT-0000" value={formData.numeroOT} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input id="cliente" placeholder="Nombre de la empresa" value={formData.cliente} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoCliente">Código Cliente</Label>
                  <Input id="codigoCliente" placeholder="Ej. C-123" value={formData.codigoCliente} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombreObra">Nombre de la Obra</Label>
                <Input id="nombreObra" placeholder="Título descriptivo del proyecto" value={formData.nombreObra} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" placeholder="Ubicación física" value={formData.direccion} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" placeholder="Detalles adicionales del proyecto..." className="min-h-[100px]" value={formData.descripcion} onChange={handleInputChange} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Documentos Técnicos (Google Drive)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
                <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Subir Archivos PDF / Planos</p>
                  <p className="text-xs text-muted-foreground">Arrastre o seleccione archivos para cargar a Drive</p>
                </div>
                <Button type="button" variant="outline" size="sm" asChild>
                  <label className="cursor-pointer">
                    Seleccionar Archivos
                    <input type="file" className="hidden" multiple accept="application/pdf" onChange={handleFileChange} />
                  </label>
                </Button>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Archivos seleccionados:</p>
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFile(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Acceso App Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuarioAcceso">Usuario de Acceso (Email)</Label>
                <Input id="usuarioAcceso" type="email" placeholder="obra@tamer.com" value={formData.usuarioAcceso} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="claveAcceso">Contraseña de Acceso</Label>
                <Input id="claveAcceso" type="text" placeholder="Ej. 123456" value={formData.claveAcceso} onChange={handleInputChange} required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Imagen de Portada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-secondary rounded-xl flex flex-col items-center justify-center border border-dashed text-muted-foreground gap-2">
                <ImageIcon className="w-8 h-8 opacity-20" />
                <p className="text-xs">Sin imagen seleccionada</p>
                <Button type="button" variant="outline" size="xs">Cambiar</Button>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20" disabled={isUploading}>
            {isUploading ? "Procesando..." : <><Save className="w-5 h-5" /> Guardar Obra</>}
          </Button>
        </div>
      </form>
    </div>
  );
}