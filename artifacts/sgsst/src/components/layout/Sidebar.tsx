import { Link, useLocation } from "wouter";
import { LayoutDashboard, Building2, Stethoscope, ShieldAlert, FileText, FileSpreadsheet, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_EMPRESA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Resumen Empresa", href: `/empresa/${DEFAULT_EMPRESA_ID}`, icon: Building2 },
    { name: "Exámenes Médicos", href: `/empresa/${DEFAULT_EMPRESA_ID}/examenes`, icon: Stethoscope },
    { name: "Matriz de Riesgos", href: `/empresa/${DEFAULT_EMPRESA_ID}/matrices`, icon: ShieldAlert },
    { name: "Actas de Comité", href: `/empresa/${DEFAULT_EMPRESA_ID}/actas`, icon: FileText },
    { name: "Planillas PILA", href: `/empresa/${DEFAULT_EMPRESA_ID}/pila`, icon: FileSpreadsheet },
    { name: "Comités Activos", href: `/empresa/${DEFAULT_EMPRESA_ID}/comites`, icon: Users },
  ];

  return (
    <div className="w-64 bg-[#064E3B] text-white flex-shrink-0 hidden md:flex flex-col border-r border-[#064E3B]/20">
      <div className="h-16 flex items-center px-6 font-bold text-lg tracking-tight bg-black/10">
        SG-SST Regis
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 bg-black/10 text-xs text-white/50">
        Plataforma para Consultores SG-SST
      </div>
    </div>
  );
}
