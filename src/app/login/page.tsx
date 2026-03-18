
"use client"

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await login(identifier, password);
      if (!success) {
        toast({
          title: "Error de acceso",
          description: "Credenciales incorrectas. Verifique sus datos.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast({
        title: "Error de sistema",
        description: "No se pudo conectar con el servidor. Intente nuevamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary rounded-3xl mb-4 shadow-xl shadow-primary/30">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0a3d62] tracking-tight">Tamer Industrial S.A.</h1>
          <p className="text-muted-foreground mt-2 font-bold uppercase tracking-widest text-[10px]">Gestión Técnica de Obras | v2.8</p>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
          <CardHeader className="space-y-1 pt-10 px-8 text-center">
            <CardTitle className="text-2xl font-black text-[#0a3d62]">Acceso al Sistema</CardTitle>
            <CardDescription className="font-medium">Ingrese sus credenciales autorizadas</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-4 px-8">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Usuario / Email</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    id="identifier"
                    type="text" 
                    placeholder="admin o email@ejemplo.com" 
                    className="pl-11 h-14 rounded-2xl border-secondary bg-secondary/20 focus:bg-white transition-all font-medium"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-11 pr-14 h-14 rounded-2xl border-secondary bg-secondary/20 focus:bg-white transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent text-[#0a3d62] z-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-8 pb-10 pt-4">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black bg-[#0a3d62] hover:bg-[#0a3d62]/90 rounded-2xl shadow-xl shadow-[#0a3d62]/20 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    VERIFICANDO...
                  </>
                ) : (
                  "INGRESAR"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-50">
          © {new Date().getFullYear()} Tamer Industrial S.A. | v2.8
        </p>
      </div>
    </div>
  );
}
