import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListEmpresas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Users, ArrowLeft, Building2, CheckCircle2, Save } from "lucide-react";

const CONSULTORES = [
  { id: "u2", nombre: "Carlos Pérez", cedula: "79854321" },
  { id: "u4", nombre: "Ana Martínez", cedula: "43218765" },
];

const ASIGNACIONES_DEFAULT: Record<string, string> = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": "u4",
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": "u2",
  "c3d4e5f6-a7b8-9012-cdef-123456789012": "u2",
  "d4e5f6a7-b8c9-0123-def0-123456789012": "u2",
  "e5f6a7b8-c9d0-1234-ef01-234567890123": "u4",
};

const LS_KEY = "sgsst_asignaciones";

function loadAsignaciones(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : { ...ASIGNACIONES_DEFAULT };
  } catch {
    return { ...ASIGNACIONES_DEFAULT };
  }
}

export default function AsignacionConsultores() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: empresas } = useListEmpresas();
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>(loadAsignaciones);
  const [dirty, setDirty] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Solo los administradores pueden gestionar asignaciones.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver
        </Button>
      </div>
    );
  }

  function handleChange(empresaId: string, consultorId: string) {
    setAsignaciones((prev) => ({ ...prev, [empresaId]: consultorId }));
    setDirty(true);
  }

  function handleGuardar() {
    localStorage.setItem(LS_KEY, JSON.stringify(asignaciones));
    setDirty(false);
    toast({ title: "Asignaciones guardadas", description: "Los cambios han sido guardados localmente." });
  }

  const list = empresas ?? [];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Asignación de Consultores</h1>
          <p className="text-sm text-muted-foreground">Relaciona cada empresa con su consultor responsable</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Consultores disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {CONSULTORES.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  {c.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">CC {c.cedula}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Empresas registradas ({list.length})
            </CardTitle>
            {dirty && (
              <Button size="sm" onClick={handleGuardar}>
                <Save className="h-4 w-4 mr-1" />
                Guardar cambios
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando empresas...</p>
          )}
          {list.map((emp) => {
            const consultorId = asignaciones[emp.id ?? ""] ?? "";
            const consultor = CONSULTORES.find((c) => c.id === consultorId);
            return (
              <div key={emp.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30">
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    NIT {emp.nit} · {emp.ciudad} · {emp.num_empleados} empleados
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {consultor ? (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 hidden sm:flex">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {consultor.nombre.split(" ")[0]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 hidden sm:flex">
                      Sin asignar
                    </Badge>
                  )}
                  <Select value={consultorId} onValueChange={(v) => handleChange(emp.id ?? "", v)}>
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSULTORES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleGuardar}>
            <Save className="h-4 w-4 mr-2" />
            Guardar todos los cambios
          </Button>
        </div>
      )}
    </div>
  );
}
