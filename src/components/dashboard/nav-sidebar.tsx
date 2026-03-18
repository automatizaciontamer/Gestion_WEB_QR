
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
  UserCheck
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
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Construction className="w-6 h-6 text-white" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-black text-lg leading-tight truncate">Tamer Ind.</h2>
            <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase truncate">
              {isAdmin ? 'Panel Admin' : 'Panel Usuario'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-gray-50/50">
        <div className="px-4 py-3 mb-4 rounded-xl bg-white border shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Usuario Activo</p>
          <p className="text-xs font-bold text-gray-800 truncate">{user?.nombre || user?.email}</p>
        </div>
        <Button 
          variant="ghost" 
          className="w-full flex items-center justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold rounded-xl"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 border-r h-full flex-col no-print shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50 no-print">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-md shadow-md border-primary/20">
              <Menu className="w-5 h-5 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
