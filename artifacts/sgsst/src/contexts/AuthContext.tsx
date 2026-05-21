import { createContext, useContext, useState, type ReactNode } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "consultor" | "empresa";
  nombre: string;
  cedula?: string;
  empresas: string[];
  fecha_inicio: string;
  fecha_fin: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  canViewEmpresa: (empresaId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: (AuthUser & { password: string })[] = [
  {
    id: "u1", username: "admin", password: "admin123",
    role: "admin", nombre: "Administrador Sistema",
    empresas: [],
    fecha_inicio: "2024-01-01", fecha_fin: "2027-12-31",
  },
  {
    id: "u2", username: "carlos.perez", password: "consultor123",
    role: "consultor", nombre: "Carlos Pérez", cedula: "79854321",
    empresas: [
      "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "d4e5f6a7-b8c9-0123-def0-123456789012",
    ],
    fecha_inicio: "2024-03-01", fecha_fin: "2026-12-31",
  },
  {
    id: "u4", username: "ana.martinez", password: "consultor456",
    role: "consultor", nombre: "Ana Martínez", cedula: "43218765",
    empresas: [
      "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "e5f6a7b8-c9d0-1234-ef01-234567890123",
    ],
    fecha_inicio: "2024-06-01", fecha_fin: "2027-06-30",
  },
  {
    id: "u3", username: "empresa1", password: "empresa123",
    role: "empresa", nombre: "María González", cedula: "52123456",
    empresas: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    fecha_inicio: "2025-01-01", fecha_fin: "2026-06-01",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("sgsst_user");
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  function login(username: string, password: string): boolean {
    const found = DEMO_USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return false;
    const { password: _pwd, ...authUser } = found;
    setUser(authUser);
    localStorage.setItem("sgsst_user", JSON.stringify(authUser));
    return true;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("sgsst_user");
  }

  function canViewEmpresa(empresaId: string): boolean {
    if (!user) return false;
    if (user.role === "admin" || user.empresas.length === 0) return true;
    return user.empresas.includes(empresaId);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, canViewEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
