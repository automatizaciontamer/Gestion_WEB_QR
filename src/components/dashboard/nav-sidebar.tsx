
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Construction, 
  Users, 
  LogOut,
  Menu,
  X,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function NavSidebar() {
  const pathname = usePathname();
  const { logout, isAdmin, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Panel Principal', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Gestión de Obras', href: '/dashboard/obras', icon: Construction, adminOnly: false },
    { name: 'Usuarios Habilitados', href: '/dashboard/clientes', icon: UserCheck, adminOnly: true },
  ];

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0a3d62] rounded-2xl flex items-center justify-center shadow-xl shadow-[#0a3d62]/20">
            <Construction className="w-7 h-7 text-white" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-black text-xl leading-tight truncate text-[#0a3d62]">Tamer Ind.</h2>
            <p className="text-[9px] text-muted-foreground font-black tracking-[0.2em] uppercase truncate">
              {isAdmin ? 'Modo Administrador' : 'Acceso Autorizado'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300",
                isActive 
                  ? "bg-[#0a3d62] text-white shadow-xl shadow-[#0a3d62]/20 translate-x-1" 
                  : "text-muted-foreground hover:bg-secondary hover:text-[#0a3d62]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-primary")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t bg-[#f8fafc]">
        <div className="px-5 py-4 mb-6 rounded-2xl bg-white border border-secondary shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
            <UserCheck className="w-3 h-3" /> Usuario Activo
          </p>
          <p className="text-xs font-black text-[#0a3d62] truncate">{user?.nombre || 'Personal Tamer'}</p>
          <p className="text-[9px] text-muted-foreground font-medium truncate mt-1">{user?.email}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-4 px-5 h-14 text-destructive hover:bg-destructive/10 hover:text-destructive font-black rounded-2xl transition-all"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          CERRAR SESIÓN
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 border-r h-full flex-col no-print shrink-0 shadow-sm z-20">
        <SidebarContent />
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-40 px-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0a3d62] rounded-lg flex items-center justify-center">
            <Construction className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-[#0a3d62] text-sm tracking-tight uppercase">Tamer Industrial</span>
        </div>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#0a3d62]">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
