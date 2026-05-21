import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FolderOpen, Upload, FileText, CheckCircle2, Clock, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";

const BASE = (import.meta.env.VITE_API_BASE ?? import.meta.env.BASE_URL ?? "").replace(/\/+$/, "");
const DEMO_EMPRESA_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const TIPOS_DOCUMENTO = [
  { value: "politica", label: "Política SG-SST" },
  { value: "plan_trabajo", label: "Plan de Trabajo Anual" },
  { value: "cronograma", label: "Cronograma de Capacitaciones" },
  { value: "acta_recursos", label: "Acta de Recursos" },
  { value: "procedimiento", label: "Procedimiento / Instructivo" },
  { value: "formato", label: "Formato / Registro" },
  { value: "otro", label: "Otro documento" },
];

const ESTADO_CONFIG = {
  cargado: { label: "Cargado", color: "bg-gray-100 text-gray-700 border-gray-300", icon: Clock },
  validado: { label: "Validado", color: "bg-blue-50 text-blue-700 border-blue-300", icon: CheckCircle2 },
  aprobado: { label: "Aprobado", color: "bg-emerald-50 text-emerald-700 border-emerald-300", icon: CheckCircle2 },
};

interface DocumentoGeneral {
  id: string;
  empresa_id: string;
  nombre: string;
  tipo: string | null;
  criterio_codigo: string | null;
  drive_url: string | null;
  estado: string;
  cargado_por: string | null;
  created_at: string;
}

interface UploadForm {
  nombre: string;
  tipo: string;
  criterio_codigo: string;
  file: File | null;
}

export default function Documentos() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_EMPRESA_ID;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<UploadForm>({ nombre: "", tipo: "otro", criterio_codigo: "", file: null });

  const { data: docs = [], isLoading } = useQuery<DocumentoGeneral[]>({
    queryKey: ["documentos", empresaId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/documentos/${empresaId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const subir = useMutation({
    mutationFn: async () => {
      if (!form.file || !form.nombre) throw new Error("Nombre y archivo requeridos");
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(form.file!);
      });
      const res = await fetch(`${BASE}/api/documentos/subir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id: empresaId,
          nombre: form.nombre,
          tipo: form.tipo || null,
          criterio_codigo: form.criterio_codigo || null,
          file_base64: base64,
          mime_type: form.file!.type,
          cargado_por: user?.email ?? null,
        }),
      });
      if (!res.ok) throw new Error("Error al subir documento");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentos", empresaId] });
      setDialogOpen(false);
      setForm({ nombre: "", tipo: "otro", criterio_codigo: "", file: null });
      toast({ title: "Documento cargado exitosamente" });
    },
    onError: (err) => {
      toast({ title: (err as Error).message, variant: "destructive" });
    },
  });

  const validar = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: "validado" | "aprobado" }) => {
      const res = await fetch(`${BASE}/api/documentos/${id}/validar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error("Error al validar");
      return res.json();
    },
    onSuccess: (_, { estado }) => {
      qc.invalidateQueries({ queryKey: ["documentos", empresaId] });
      const label = estado === "aprobado" ? "aprobado" : "validado";
      toast({ title: `Documento ${label} correctamente` });
    },
    onError: () => toast({ title: "Error al actualizar estado", variant: "destructive" }),
  });

  const grouped = TIPOS_DOCUMENTO.reduce<Record<string, DocumentoGeneral[]>>((acc, t) => {
    acc[t.value] = docs.filter((d) => d.tipo === t.value);
    return acc;
  }, {});
  const sinTipo = docs.filter((d) => !d.tipo || !TIPOS_DOCUMENTO.find((t) => t.value === d.tipo));

  const canValidate = user?.role === "admin" || user?.role === "consultor";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/empresa/${empresaId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documentos Generales SG-SST</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Políticas, planes, cronogramas y registros del sistema</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />Cargar Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cargar Nuevo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Nombre del documento</Label>
                <Input
                  placeholder="Ej. Política de Seguridad y Salud en el Trabajo"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de documento</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Criterio Res. 0312 asociado (opcional)</Label>
                <Input
                  placeholder="Ej. 1.1.1"
                  value={form.criterio_codigo}
                  onChange={(e) => setForm((f) => ({ ...f, criterio_codigo: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground">Si se aprueba, marca el criterio como Cumple automáticamente</p>
              </div>
              <div className="space-y-1.5">
                <Label>Archivo</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.doc,.jpg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setForm((prev) => ({ ...prev, file: f, nombre: prev.nombre || (f?.name.replace(/\.[^.]+$/, "") ?? "") }));
                  }}
                />
                <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  {form.file ? form.file.name : "Seleccionar archivo"}
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={subir.isPending || !form.nombre || !form.file}
                onClick={() => subir.mutate()}
              >
                {subir.isPending ? "Subiendo…" : "Cargar a Drive y Registrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground py-8 text-center">Cargando documentos…</div>
      )}

      {!isLoading && docs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay documentos cargados aún.</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Cargar primer documento
            </Button>
          </CardContent>
        </Card>
      )}

      {TIPOS_DOCUMENTO.map((tipo) => {
        const group = grouped[tipo.value];
        if (!group?.length) return null;
        return (
          <Card key={tipo.value}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {tipo.label}
                <Badge variant="outline" className="ml-auto text-xs">{group.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Criterio</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Estado</th>
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((doc) => {
                    const estadoConf = ESTADO_CONFIG[doc.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.cargado;
                    return (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-2.5">
                          <div className="font-medium">{doc.nombre}</div>
                          {doc.cargado_por && (
                            <div className="text-xs text-muted-foreground">{doc.cargado_por}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs font-mono text-muted-foreground">
                          {doc.criterio_codigo ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="outline" className={`text-xs ${estadoConf.color}`}>
                            {estadoConf.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            {doc.drive_url && (
                              <a
                                href={doc.drive_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <FolderOpen className="h-3.5 w-3.5" />
                                Drive
                              </a>
                            )}
                            {canValidate && doc.estado === "cargado" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                disabled={validar.isPending}
                                onClick={() => validar.mutate({ id: doc.id, estado: "validado" })}
                              >
                                Validar
                              </Button>
                            )}
                            {canValidate && doc.estado === "validado" && (
                              <Button
                                size="sm"
                                className="h-6 text-xs px-2 bg-emerald-600 hover:bg-emerald-700"
                                disabled={validar.isPending}
                                onClick={() => validar.mutate({ id: doc.id, estado: "aprobado" })}
                              >
                                Aprobar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}

      {sinTipo.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Otros documentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {sinTipo.map((doc) => {
                  const estadoConf = ESTADO_CONFIG[doc.estado as keyof typeof ESTADO_CONFIG] ?? ESTADO_CONFIG.cargado;
                  return (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">{doc.nombre}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="outline" className={`text-xs ${estadoConf.color}`}>{estadoConf.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {doc.drive_url && (
                          <a href={doc.drive_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
                            <FolderOpen className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
