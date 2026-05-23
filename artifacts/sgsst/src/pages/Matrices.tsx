import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useGenerarMatriz,
  useListMatrices,
  useGetEmpresa,
  getListMatricesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Sparkles, AlertTriangle, Download, FileType2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";
import { DRIVE_FOLDERS } from "@/lib/drive-config";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

const NIVEL_COLORS: Record<string, string> = {
  nivel_I: "bg-red-700 text-white",
  nivel_II: "bg-orange-500 text-white",
  nivel_III: "bg-amber-400 text-gray-900",
  nivel_IV: "bg-emerald-500 text-white",
};

const NIVEL_LABELS: Record<string, string> = {
  nivel_I: "Nivel I (Muy Alto)",
  nivel_II: "Nivel II (Alto)",
  nivel_III: "Nivel III (Medio)",
  nivel_IV: "Nivel IV (Bajo)",
};

interface FormValues {
  ciiu: string;
  num_empleados: string;
  procesos: string;
  descripcion: string;
}

export default function Matrices() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;
  const qc = useQueryClient();
  const { toast } = useToast();
  const [lastResult, setLastResult] = useState<(NonNullable<ReturnType<typeof useGenerarMatriz>["data"]> & { version?: number }) | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<"docx" | "pdf" | null>(null);
  const [matrizDriveUrl, setMatrizDriveUrl] = useState<string | null>(null);

  const generar = useGenerarMatriz();
  const { data: empresa } = useGetEmpresa(empresaId);
  const { data: matrices, isLoading } = useListMatrices(empresaId, {
    query: { queryKey: getListMatricesQueryKey(empresaId) },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { ciiu: "", num_empleados: "", procesos: "", descripcion: "" },
  });

  useEffect(() => {
    if (empresa) {
      const ciiu = empresa.codigo_ciiu ?? "";
      const procesos = ciiu === "4711"
        ? "Ventas al detal, bodegaje, atención al cliente, caja, inventarios"
        : ciiu === "4111"
          ? "Obras civiles, excavaciones, trabajo en alturas, soldadura, encofrados"
          : ciiu === "8610"
            ? "Atención médica, cirugías, laboratorio clínico, urgencias, esterilización"
            : "";
      reset({
        ciiu,
        num_empleados: empresa.num_empleados ? String(empresa.num_empleados) : "",
        procesos,
        descripcion: "",
      });
    }
  }, [empresa, reset]);

  function onSubmit(values: FormValues) {
    generar.mutate(
      {
        data: {
          empresa_id: empresaId,
          ciiu: values.ciiu,
          num_empleados: values.num_empleados ? Number(values.num_empleados) : undefined,
          procesos: values.procesos || undefined,
          descripcion: values.descripcion || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setLastResult(data as typeof data & { version?: number });
          setMatrizDriveUrl(null);
          qc.invalidateQueries({ queryKey: getListMatricesQueryKey(empresaId) });
          toast({ title: "Matriz GTC-45 generada con IA" });
        },
        onError: () => toast({ title: "Error al generar la matriz", variant: "destructive" }),
      }
    );
  }

  async function handleDownload(formato: "docx" | "pdf") {
    if (!lastResult?.matriz_id) return;
    setDownloadingFormat(formato);
    try {
      const resp = await fetch(`${API_BASE}/api/matrices/${lastResult.matriz_id}/exportar?formato=${formato}`);
      if (!resp.ok) throw new Error("Error generating document");
      const driveUrl = resp.headers.get("X-Drive-Url");
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `Matriz_GTC45_${lastResult.ciiu}_v${lastResult.version ?? 1}_${new Date().toISOString().slice(0, 10)}.${formato}`;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      if (driveUrl) setMatrizDriveUrl(driveUrl);
      toast({ title: driveUrl ? "Documento guardado en Drive" : `Documento .${formato} descargado` });
    } catch {
      toast({ title: "Error al generar el documento", variant: "destructive" });
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <div className="space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Matriz de Peligros y Riesgos"
        subtitulo="GTC-45 · Generación con IA por código CIIU"
        driveModule="matrices"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Generar Matriz GTC-45
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Datos pre-cargados según el perfil de la empresa. Puede editarlos antes de generar.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ciiu">Código CIIU *</Label>
                  <Input
                    id="ciiu"
                    placeholder="Ej: 4711"
                    data-testid="input-ciiu"
                    {...register("ciiu", { required: "El código CIIU es requerido" })}
                  />
                  {errors.ciiu && <p className="text-xs text-destructive">{errors.ciiu.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="num_empleados">Número de empleados</Label>
                  <Input
                    id="num_empleados"
                    type="number"
                    placeholder="Ej: 45"
                    data-testid="input-num-empleados"
                    {...register("num_empleados")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="procesos">Procesos principales</Label>
                <Textarea
                  id="procesos"
                  rows={3}
                  placeholder="Ej: Ventas al detal, bodegaje, atención al cliente..."
                  data-testid="input-procesos"
                  {...register("procesos")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="descripcion">Información adicional</Label>
                <Textarea
                  id="descripcion"
                  rows={2}
                  placeholder="Características especiales de la empresa..."
                  data-testid="input-descripcion"
                  {...register("descripcion")}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="submit" className="flex-1" disabled={generar.isPending} data-testid="btn-generar-matriz">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generar.isPending ? "Generando con IA..." : "Generar Matriz"}
                </Button>
                {lastResult && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDownload("docx")}
                      disabled={!!downloadingFormat}
                      title="Descargar .docx"
                      data-testid="btn-download-matriz-docx"
                    >
                      <Download className="h-4 w-4 mr-1.5" />
                      {downloadingFormat === "docx" ? "…" : ".docx"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDownload("pdf")}
                      disabled={!!downloadingFormat}
                      title="Descargar PDF"
                      data-testid="btn-download-matriz-pdf"
                    >
                      <FileType2 className="h-4 w-4 mr-1.5" />
                      {downloadingFormat === "pdf" ? "…" : ".pdf"}
                    </Button>
                  </>
                )}
              </div>
              {matrizDriveUrl && (
                <a href={matrizDriveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline mt-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en Google Drive
                </a>
              )}
            </form>
          </CardContent>
        </Card>

        {lastResult && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Resultado: {lastResult.actividad_economica}</CardTitle>
              <p className="text-xs text-muted-foreground">CIIU {lastResult.ciiu} · {lastResult.num_peligros} peligros identificados</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Distribución por Nivel de Riesgo</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(lastResult.niveles_riesgo ?? {}).map(([nivel, count]) => (
                    <div key={nivel} className={cn("rounded px-3 py-2 text-center", NIVEL_COLORS[nivel] ?? "bg-gray-100")}>
                      <div className="text-lg font-bold">{String(count)}</div>
                      <div className="text-xs opacity-90">{NIVEL_LABELS[nivel] ?? nivel}</div>
                    </div>
                  ))}
                </div>
              </div>
              {Array.isArray(lastResult.peligros_prioritarios) && lastResult.peligros_prioritarios.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Peligros Prioritarios
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {(lastResult.peligros_prioritarios as string[]).map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Matrices Generadas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>CIIU</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Drive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!matrices || matrices.length === 0) ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Sin matrices generadas</TableCell></TableRow>
                ) : matrices.map((m) => (
                  <TableRow key={m.id} data-testid={`matriz-row-${m.id}`}>
                    <TableCell className="text-sm">{new Date(m.created_at!).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell className="font-mono text-sm">{m.codigo_ciiu}</TableCell>
                    <TableCell className="text-sm">v{m.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{m.estado}</Badge>
                    </TableCell>
                    <TableCell>
                      {(m as { drive_url?: string | null }).drive_url ? (
                        <a href={(m as { drive_url?: string | null }).drive_url!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                          <ExternalLink className="h-3 w-3" />Ver archivo
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
