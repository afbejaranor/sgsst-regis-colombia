import { Link, useLocation, useRoute } from "wouter";
import {
  LayoutDashboard, Building2, Stethoscope, ShieldAlert,
  FileText, FileSpreadsheet, Users, ChevronDown, ClipboardList,
  LogOut, UserCircle, ShieldCheck, UserCog, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListEmpresas } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const MODULE_ITEMS = [
  { name: "Resumen Empresa", path: "", icon: Building2 },
  { name: "Plan de Acción", path: "/plan", icon: ClipboardList },
  { name: "Exámenes Médicos", path: "/examenes", icon: Stethoscope },
  { name: "Matriz de Riesgos", path: "/matrices", icon: ShieldAlert },
  { name: "Actas de Comité", path: "/actas", icon: FileText },
  { name: "Planillas PILA", path: "/pila", icon: FileSpreadsheet },
  { name: "Comités Activos", path: "/comites", icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  consultor: "Consultor",
  empresa: "Empresa",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-200",
  consultor: "bg-blue-500/20 text-blue-200",
  empresa: "bg-amber-500/20 text-amber-200",
};

export function Sidebar() {
  const [location] = useLocation();
  const [matchEmpresa, params] = useRoute("/empresa/:id*");
  const currentId = matchEmpresa ? params?.id?.split("/")[0] : null;
  const { user, logout } = useAuth();
  const [, navigate] = useState<unknown>(null);

  const { data: allEmpresas } = useListEmpresas();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const empresas = allEmpresas?.filter((e) => {
    if (!user) return false;
    if (user.role === "admin" || user.empresas.length === 0) return true;
    return user.empresas.includes(e.id ?? "");
  });

  useEffect(() => {
    if (currentId) {
      setSelectedId(currentId);
    } else if (empresas?.length && !selectedId) {
      setSelectedId(empresas[0].id ?? null);
    }
  }, [currentId, empresas]);

  const activeEmpresa = empresas?.find((e) => e.id === selectedId) ?? empresas?.[0];
  const activeId = activeEmpresa?.id ?? selectedId ?? "";

  function handleLogout() {
    logout();
    window.location.href = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") + "/login";
  }

  return (
    <div className="w-64 bg-[#064E3B] text-white flex-shrink-0 hidden md:flex flex-col border-r border-[#064E3B]/20">
      <div className="h-16 flex items-center px-6 gap-2 font-bold text-lg tracking-tight bg-black/10">
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        SG-SST Regis
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {user?.role === "admin" && (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location === "/dashboard"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                Dashboard
              </Link>
              <Link
                href="/empresa/nueva"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location === "/empresa/nueva"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                Nueva Empresa
              </Link>
              <Link
                href="/admin/asignacion"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location === "/admin/asignacion"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <UserCog className="h-5 w-5 flex-shrink-0" />
                Consultores
              </Link>
            </>
          )}
          {user?.role === "consultor" && (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location === "/dashboard"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
                Mis Empresas
              </Link>
              <Link
                href="/empresa/nueva"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location === "/empresa/nueva"
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                Nueva Empresa
              </Link>
            </>
          )}

          {empresas && empresas.length > 0 && (
            <div className="mt-4 mb-1">
              <p className="px-3 text-[10px] uppercase tracking-widest text-white/40 mb-1">
                Empresa activa
              </p>
              <button
                onClick={() => setSelectorOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <span className="truncate text-left">{activeEmpresa?.nombre ?? "Seleccionar..."}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform", selectorOpen && "rotate-180")} />
              </button>
              {selectorOpen && (
                <div className="mt-1 bg-black/20 rounded-md overflow-hidden">
                  {empresas.map((emp) => (
                    <Link
                      key={emp.id}
                      href={`/empresa/${emp.id}`}
                      onClick={() => { setSelectedId(emp.id ?? null); setSelectorOpen(false); }}
                      className={cn(
                        "block px-3 py-2 text-xs transition-colors",
                        emp.id === activeId
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="truncate">{emp.nombre}</div>
                      <div className="text-white/40 text-[10px]">{emp.ciudad} · {emp.num_empleados} empleados</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeId && (
            <div className="space-y-0.5 pt-1">
              {MODULE_ITEMS.map((item) => {
                const href = `/empresa/${activeId}${item.path}`;
                const isActive = location === href;
                return (
                  <Link
                    key={href}
                    href={href}
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
            </div>
          )}
        </nav>
      </div>

      {user && (
        <div className="px-3 pb-3 space-y-2">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <UserCircle className="h-8 w-8 text-white/60 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user.nombre}</p>
                {user.cedula && <p className="text-[10px] text-white/50">CC {user.cedula}</p>}
              </div>
            </div>
            <span className={cn("inline-block text-[10px] font-medium px-2 py-0.5 rounded-full", ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
