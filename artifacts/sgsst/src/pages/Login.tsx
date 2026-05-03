import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password);
      setLoading(false);
      if (ok) {
        navigate("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#064E3B] to-[#047857] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 rounded-2xl p-4">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SG-SST Regis</h1>
          <p className="text-white/70 mt-2 text-sm">Plataforma de Gestión de Seguridad y Salud en el Trabajo</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold text-center">Iniciar Sesión</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-[#064E3B] hover:bg-[#064E3B]/90" disabled={loading}>
                {loading ? "Verificando..." : "Ingresar"}
              </Button>
            </form>

            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground font-medium mb-3 text-center">Usuarios de demostración</p>
              <div className="space-y-2">
                {[
                  { user: "admin", pwd: "admin123", role: "Administrador", badge: "bg-purple-100 text-purple-700" },
                  { user: "carlos.perez", pwd: "consultor123", role: "Consultor", badge: "bg-blue-100 text-blue-700" },
                  { user: "empresa1", pwd: "empresa123", role: "Empresa", badge: "bg-amber-100 text-amber-700" },
                ].map((d) => (
                  <button
                    key={d.user}
                    type="button"
                    onClick={() => { setUsername(d.user); setPassword(d.pwd); }}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-xs"
                  >
                    <div>
                      <span className="font-mono font-medium">{d.user}</span>
                      <span className="text-muted-foreground ml-2">/ {d.pwd}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${d.badge}`}>{d.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-white/50 text-xs">
          © 2026 Regis Colombia · Resolución 0312 de 2019
        </p>
      </div>
    </div>
  );
}
