import { useParams } from "wouter";
import { useState, useRef } from "react";
import {
  useProcesarExamen,
  useListExamenes,
  getListExamenesQueryKey,
  useGetEmpresa,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Upload, Stethoscope, CheckCircle2, AlertTriangle, XCircle, Clock,
  FolderOpen, FileText, ExternalLink, CloudUpload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DRIVE_FOLDERS, DRIVE_DOCS } from "@/lib/drive-config";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const CONCEPTO_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  apto: { label: "Apto", icon: CheckCircle2, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  apto_con_restricciones: { label: "Apto c/ Restricciones", icon: AlertTriangle, cls: "text-amber-700 bg-amber-50 border-amber-200" },
  no_apto: { label: "No Apto", icon: XCircle, cls: "text-red-700 bg-red-50 border-red-200" },
  pendiente: { label: "Pendiente", icon: Clock, cls: "text-gray-600 bg-gray-50 border-gray-200" },
};

function ConceptoBadge({ concepto }: { concepto: string }) {
  const cfg = CONCEPTO_CONFIG[concepto] ?? CONCEPTO_CONFIG.pendiente;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium", cfg.cls)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

export default function Examenes() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [lastResult, setLastResult] = useState<NonNullable<ReturnType<typeof useProcesarExamen>["data"]> | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");

  const procesar = useProcesarExamen();
  const { data: examenes, isLoading } = useListExamenes(empresaId, {
    query: { queryKey: getListExamenesQueryKey(empresaId) },
  });

  const driveFolder = DRIVE_FOLDERS[empresaId]?.examenes ?? DRIVE_FOLDERS[DEMO_ID]?.examenes;
  const driveDocs = DRIVE_DOCS[empresaId]?.examenes ?? DRIVE_DOCS[DEMO_ID]?.examenes ?? [];

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { resolve((reader.result as string).split(",")[1] ?? ""); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      toast({ title: "Solo se aceptan archivos PDF", variant: "destructive" });
      return;
    }
    setUploadStatus("idle");
    const b64 = await readFileAsBase64(file);
    const nombreArr = file.name.replace(".pdf", "").split("_");
    procesar.mutate(
      {
        data: {
          empresa_id: empresaId,
          pdf_base64: b64,
          nombre_trabajador: nombreArr[0] ?? undefined,
        },
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setUploadStatus("success");
          qc.invalidateQueries({ queryKey: getListExamenesQueryKey(empresaId) });
          toast({ title: "Documento cargado y procesado correctamente" });
        },
        onError: () => {
          setUploadStatus("error");
          toast({ title: "Error al procesar el documento", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Exámenes Médicos Ocupacionales"
        subtitulo="Res. 2346/2007 · Procesamiento con IA"
        driveModule="examenes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudUpload className="h-5 w-5 text-primary" />
              Cargar Nuevo Documento
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Carga el documento en PDF, el cual será guardado automáticamente en el Drive relacionado a la compañía.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors",
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
              data-testid="drop-zone-examenes"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Arrastre el PDF del examen médico aquí<br />o haga clic para seleccionar
              </p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {procesar.isPending && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                Analizando con IA y guardando en Drive...
              </div>
            )}

            {uploadStatus === "success" && !procesar.isPending && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Documento cargado y guardado exitosamente en Drive.
              </div>
            )}
            {uploadStatus === "error" && !procesar.isPending && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0" />
                Error al cargar el documento. Intente nuevamente.
              </div>
            )}
          </CardContent>
        </Card>

        {lastResult && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Resultado del Análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Concepto médico</span>
                <ConceptoBadge concepto={lastResult.concepto ?? "pendiente"} />
              </div>
              {lastResult.requiere_seguimiento && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  Requiere seguimiento
                </Badge>
              )}
              {Array.isArray(lastResult.restricciones) && lastResult.restricciones.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Restricciones</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {(lastResult.restricciones as string[]).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {Array.isArray(lastResult.recomendaciones) && lastResult.recomendaciones.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Recomendaciones</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {(lastResult.recomendaciones as string[]).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Documentos en Drive
            </CardTitle>
            <a
              href={driveFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir carpeta
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tamaño</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driveDocs.map((doc, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <a
                      href={driveFolder}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                      {doc.nombre}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm">{doc.tipo}</TableCell>
                  <TableCell className="text-sm">{new Date(doc.fecha).toLocaleDateString("es-CO")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.tamano}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de Exámenes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Concepto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!examenes || examenes.length === 0) ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Sin exámenes registrados</TableCell></TableRow>
                ) : examenes.map((e) => (
                  <TableRow key={e.id} data-testid={`examen-row-${e.id}`}>
                    <TableCell className="text-sm">{e.fecha_examen ? new Date(e.fecha_examen).toLocaleDateString("es-CO") : "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{e.tipo?.replace("_", " ") ?? "—"}</TableCell>
                    <TableCell className="text-sm">{e.medico ?? "—"}</TableCell>
                    <TableCell><ConceptoBadge concepto={e.concepto ?? "pendiente"} /></TableCell>
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
