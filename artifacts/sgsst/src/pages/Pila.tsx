import { useParams } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useProcesarPila } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";
import { DRIVE_FOLDERS } from "@/lib/drive-config";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

interface PilaRecord {
  id?: string;
  periodo: string;
  estado: "pagada" | "pendiente" | "parcial" | "recibido" | string;
  num_afiliados?: Record<string, number>;
  aportes_liquidados?: Record<string, number>;
  total?: number | null;
  drive_url?: string | null;
  fecha_recepcion?: string | null;
}

const DEMO_TRACKING: PilaRecord[] = [
  { periodo: "2025-04", estado: "pendiente", num_afiliados: { salud: 45, pension: 45, arl: 45, ccf: 45 }, total: null },
  { periodo: "2025-03", estado: "parcial",   num_afiliados: { salud: 44, pension: 44, arl: 44, ccf: 44 }, total: 2658000 },
  { periodo: "2025-02", estado: "pagada",    num_afiliados: { salud: 45, pension: 45, arl: 45, ccf: 45 }, total: 2920000 },
  { periodo: "2025-01", estado: "pagada",    num_afiliados: { salud: 45, pension: 45, arl: 45, ccf: 45 }, total: 2780000 },
  { periodo: "2024-12", estado: "pagada",    num_afiliados: { salud: 44, pension: 44, arl: 44, ccf: 44 }, total: 3100000 },
  { periodo: "2024-11", estado: "pagada",    num_afiliados: { salud: 44, pension: 44, arl: 44, ccf: 44 }, total: 2980000 },
];

const ESTADO_CONFIG: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  pagada:   { label: "Pagada",    cls: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  recibido: { label: "Recibida",  cls: "bg-blue-100 text-blue-700 border-blue-200",         icon: CheckCircle2 },
  pendiente:{ label: "Pendiente", cls: "bg-red-100 text-red-700 border-red-200",             icon: Clock },
  parcial:  { label: "Parcial",   cls: "bg-amber-100 text-amber-700 border-amber-200",       icon: AlertTriangle },
};

function getEstadoConfig(estado: string) {
  return ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.pendiente;
}

function formatPeriodo(p: string) {
  const [y, m] = p.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[parseInt(m) - 1] ?? m} ${y}`;
}

function formatCurrency(n: number | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function getTotalAfiliados(r: PilaRecord): number {
  if (!r.num_afiliados) return 0;
  return Math.max(...Object.values(r.num_afiliados));
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
  const [pilaDriveUrl, setPilaDriveUrl] = useState<string | null>(null);
  const [records, setRecords] = useState<PilaRecord[]>(
    empresaId === DEMO_ID ? DEMO_TRACKING : []
  );
  const [loadingRecords, setLoadingRecords] = useState(empresaId !== DEMO_ID);

  const procesar = useProcesarPila();
  const driveFolder = DRIVE_FOLDERS[empresaId]?.pila ?? DRIVE_FOLDERS[DEMO_ID]?.pila;

  // Load planilla records from DB
  useEffect(() => {
    async function fetchRecords() {
      setLoadingRecords(true);
      try {
        const resp = await fetch(`${API_BASE}/api/pila/${empresaId}`);
        if (resp.ok) {
          const data = await resp.json() as PilaRecord[];
          if (data.length > 0) {
            setRecords(data);
          } else if (empresaId === DEMO_ID) {
            setRecords(DEMO_TRACKING);
          }
        }
      } catch {
        if (empresaId === DEMO_ID) setRecords(DEMO_TRACKING);
      } finally {
        setLoadingRecords(false);
      }
    }
    fetchRecords();
  }, [empresaId]);

  const pagadas = records.filter((t) => t.estado === "pagada").length;
  const pendientes = records.filter((t) => t.estado !== "pagada" && t.estado !== "recibido").length;

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
          const url = (data as { drive_url?: string | null }).drive_url ?? null;
          setPilaDriveUrl(url);

          // Build new record from the response and prepend to table
          const numAfiliados = (data.num_afiliados as Record<string, number>) ?? {};
          const aportesLiq = (data as { aportes_liquidados?: Record<string, number> }).aportes_liquidados ?? {};
          const newRecord: PilaRecord = {
            periodo: data.periodo ?? periodo,
            estado: data.estado ?? "recibido",
            num_afiliados: numAfiliados,
            aportes_liquidados: aportesLiq,
            total: aportesLiq.total ?? null,
            drive_url: url,
          };

          setRecords((prev) => {
            // Replace existing entry for same periodo, or prepend
            const filtered = prev.filter((r) => r.periodo !== newRecord.periodo);
            return [newRecord, ...filtered];
          });

          toast({ title: url ? "Planilla procesada y archivada en Drive" : "Planilla procesada exitosamente" });
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
            <p className="text-2xl font-bold">{records.length}</p>
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
          {loadingRecords ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No hay planillas registradas. Cargue la primera planilla.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Afiliados</TableHead>
                  <TableHead className="text-right">Total aportes</TableHead>
                  <TableHead className="text-right">Drive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((t) => {
                  const cfg = getEstadoConfig(t.estado);
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
                      <TableCell className="text-right text-sm">{getTotalAfiliados(t) || "—"}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(t.total)}</TableCell>
                      <TableCell className="text-right">
                        {t.drive_url ? (
                          <a href={t.drive_url} target="_blank" rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                            <ExternalLink className="h-3 w-3" />
                            Ver
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
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
                <span>Planilla cargada y procesada{pilaDriveUrl ? " · archivada en Drive" : ""}.</span>
                {pilaDriveUrl && (
                  <a href={pilaDriveUrl} target="_blank" rel="noopener noreferrer"
                     className="ml-auto flex items-center gap-1 underline text-xs">
                    <ExternalLink className="h-3 w-3" />Abrir en Drive
                  </a>
                )}
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
              {(() => {
                const aportes = (lastResult as { aportes_liquidados?: Record<string, number> }).aportes_liquidados;
                if (!aportes || !Object.keys(aportes).length) return null;
                const order = ["salud", "pension", "arl", "ccf", "sena", "icbf", "total"];
                const entries = order
                  .filter((k) => aportes[k] != null && aportes[k] > 0)
                  .map((k) => [k, aportes[k]] as [string, number]);
                if (!entries.length) return null;
                return (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Aportes Liquidados</p>
                    <div className="space-y-1">
                      {entries.map(([sistema, monto]) => (
                        <div key={sistema} className={cn(
                          "flex justify-between text-sm px-2 py-1 rounded",
                          sistema === "total" ? "bg-primary/10 font-semibold" : "bg-muted/30"
                        )}>
                          <span className="uppercase text-xs">{sistema}</span>
                          <span>{formatCurrency(monto)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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
