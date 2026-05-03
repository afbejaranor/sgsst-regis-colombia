import { useParams } from "wouter";
import { useState, useRef } from "react";
import { useProcesarPila } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";
import { DRIVE_FOLDERS } from "@/lib/drive-config";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface PilaRecord {
  periodo: string;
  estado: "pagada" | "pendiente" | "parcial";
  afiliados: number;
  total: number | null;
}

const PILA_TRACKING: Record<string, PilaRecord[]> = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": [
    { periodo: "2025-04", estado: "pendiente", afiliados: 45, total: null },
    { periodo: "2025-03", estado: "parcial", afiliados: 44, total: 2658000 },
    { periodo: "2025-02", estado: "pagada", afiliados: 45, total: 2920000 },
    { periodo: "2025-01", estado: "pagada", afiliados: 45, total: 2780000 },
    { periodo: "2024-12", estado: "pagada", afiliados: 44, total: 3100000 },
    { periodo: "2024-11", estado: "pagada", afiliados: 44, total: 2980000 },
  ],
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": [
    { periodo: "2025-04", estado: "pagada", afiliados: 120, total: 18400000 },
    { periodo: "2025-03", estado: "pagada", afiliados: 118, total: 17200000 },
    { periodo: "2025-02", estado: "pagada", afiliados: 120, total: 18900000 },
    { periodo: "2025-01", estado: "pagada", afiliados: 119, total: 18600000 },
    { periodo: "2024-12", estado: "pagada", afiliados: 122, total: 19500000 },
    { periodo: "2024-11", estado: "pagada", afiliados: 120, total: 17800000 },
  ],
  "c3d4e5f6-a7b8-9012-cdef-123456789012": [
    { periodo: "2025-04", estado: "pagada", afiliados: 85, total: 13400000 },
    { periodo: "2025-03", estado: "pagada", afiliados: 85, total: 13100000 },
    { periodo: "2025-02", estado: "pagada", afiliados: 84, total: 12900000 },
    { periodo: "2025-01", estado: "pagada", afiliados: 85, total: 12600000 },
    { periodo: "2024-12", estado: "pagada", afiliados: 85, total: 13200000 },
    { periodo: "2024-11", estado: "pagada", afiliados: 83, total: 12800000 },
  ],
};

const ESTADO_CONFIG = {
  pagada: { label: "Pagada", cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  pendiente: { label: "Pendiente", cls: "bg-red-100 text-red-700 border-red-200", icon: Clock },
  parcial: { label: "Parcial", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
};

function formatPeriodo(p: string) {
  const [y, m] = p.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function formatCurrency(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function Pila() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [periodo, setPeriodo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [lastResult, setLastResult] = useState<NonNullable<ReturnType<typeof useProcesarPila>["data"]> | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const procesar = useProcesarPila();
  const tracking = PILA_TRACKING[empresaId] ?? PILA_TRACKING[DEMO_ID];
  const driveFolder = DRIVE_FOLDERS[empresaId]?.pila ?? DRIVE_FOLDERS[DEMO_ID]?.pila;

  const pagadas = tracking.filter((t) => t.estado === "pagada").length;
  const pendientes = tracking.filter((t) => t.estado !== "pagada").length;

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      toast({ title: "Solo se aceptan archivos PDF", variant: "destructive" });
      return;
    }
    if (!periodo) {
      toast({ title: "Seleccione el período antes de cargar", variant: "destructive" });
      return;
    }
    setUploadStatus("idle");
    const b64 = await readFileAsBase64(file);
    procesar.mutate(
      { data: { empresa_id: empresaId, periodo, pdf_base64: b64 } },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setUploadStatus("success");
          toast({ title: "Planilla procesada y archivada en Drive" });
        },
        onError: () => {
          setUploadStatus("error");
          toast({ title: "Error al procesar la planilla", variant: "destructive" });
        },
      }
    );
  }

  const numAfiliados = lastResult?.num_afiliados as Record<string, number> | undefined;
  const alertas = lastResult?.alertas as string[] | undefined;

  return (
    <div className="space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Planillas PILA"
        subtitulo="Procesamiento de pagos de seguridad social con IA"
        driveModule="pila"
      />

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Períodos registrados</p>
            <p className="text-2xl font-bold">{tracking.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pagadas</p>
            <p className="text-2xl font-bold text-emerald-600">{pagadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Con novedad</p>
            <p className="text-2xl font-bold text-red-500">{pendientes}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Seguimiento de Planillas</CardTitle>
            <a
              href={driveFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver en Drive
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Afiliados</TableHead>
                <TableHead className="text-right">Total pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracking.map((t) => {
                const cfg = ESTADO_CONFIG[t.estado];
                const Icon = cfg.icon;
                return (
                  <TableRow key={t.periodo}>
                    <TableCell className="font-medium text-sm">{formatPeriodo(t.periodo)}</TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium", cfg.cls)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">{t.afiliados}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(t.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Cargar Planilla PILA
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Carga el documento en PDF. Será archivado automáticamente en la carpeta Drive de la compañía.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="periodo">Período</Label>
              <Input
                id="periodo"
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                data-testid="input-periodo"
              />
            </div>

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              data-testid="drop-zone-pila"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Arrastre la planilla PILA en PDF aquí<br />o haga clic para seleccionar
              </p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {procesar.isPending && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                Procesando con IA y archivando en Drive...
              </div>
            )}
            {uploadStatus === "success" && !procesar.isPending && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Planilla cargada y archivada exitosamente en Drive.
              </div>
            )}
            {uploadStatus === "error" && !procesar.isPending && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                Error al cargar la planilla. Intente nuevamente.
              </div>
            )}
          </CardContent>
        </Card>

        {lastResult && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Período {lastResult.periodo}
              </CardTitle>
              <Badge variant="outline" className="w-fit text-emerald-700 border-emerald-300 bg-emerald-50 capitalize">
                {lastResult.estado}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {numAfiliados && Object.keys(numAfiliados).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Afiliados por Sistema</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(numAfiliados).map(([sistema, count]) => (
                      <div key={sistema} className="bg-muted/50 rounded p-3 text-center">
                        <div className="text-xl font-bold text-foreground">{count}</div>
                        <div className="text-xs text-muted-foreground uppercase">{sistema}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {alertas && alertas.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Alertas de Validación
                  </p>
                  <ul className="space-y-1">
                    {alertas.map((a, i) => (
                      <li key={i} className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
