import { useParams } from "wouter";
import { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  useGenerarActa,
  useListActas,
  getListActasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Sparkles, Plus, Trash2, ScrollText,
  Download, Upload, CheckCircle2, CloudUpload, ExternalLink,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

interface FormValues {
  tipo_comite: "COPASST" | "convivencia";
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  asistentes: { nombre: string; cargo: string }[];
  puntos: { texto: string }[];
  transcripcion: string;
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-700 border-gray-200",
  revisado: "bg-blue-100 text-blue-700 border-blue-200",
  firmado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  archivado: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function Actas() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastResult, setLastResult] = useState<NonNullable<ReturnType<typeof useGenerarActa>["data"]> | null>(null);
  const [tipoComite, setTipoComite] = useState<"COPASST" | "convivencia">("COPASST");
  const [uploadActaStatus, setUploadActaStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadDriveUrl, setUploadDriveUrl] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<"doc" | "pdf" | null>(null);
  const [actaDriveUrl, setActaDriveUrl] = useState<string | null>(null);

  const generar = useGenerarActa();
  const { data: actas, isLoading } = useListActas(empresaId, {
    query: { queryKey: getListActasQueryKey(empresaId) },
  });

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      tipo_comite: "COPASST",
      fecha: new Date().toISOString().split("T")[0],
      hora_inicio: "09:00",
      hora_fin: "10:00",
      lugar: "Sala de Reuniones",
      transcripcion: "",
      asistentes: [
        { nombre: "Juan Pérez", cargo: "Presidente COPASST" },
        { nombre: "Ana Rodríguez", cargo: "Secretaria" },
      ],
      puntos: [
        { texto: "Revisión de accidentes e incidentes del período" },
        { texto: "Seguimiento a compromisos de la reunión anterior" },
        { texto: "Inspecciones de seguridad programadas" },
      ],
    },
  });

  const { fields: asistentes, append: addAsistente, remove: removeAsistente } = useFieldArray({ control, name: "asistentes" });
  const { fields: puntos, append: addPunto, remove: removePunto } = useFieldArray({ control, name: "puntos" });

  function onSubmit(values: FormValues) {
    generar.mutate(
      {
        data: {
          empresa_id: empresaId,
          tipo_comite: tipoComite,
          fecha: values.fecha,
          hora_inicio: values.hora_inicio,
          hora_fin: values.hora_fin,
          lugar: values.lugar,
          asistentes: values.asistentes,
          puntos: values.puntos.map((p) => p.texto),
          transcripcion: values.transcripcion || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setActaDriveUrl(null);
          setUploadActaStatus("idle");
          setUploadDriveUrl(null);
          qc.invalidateQueries({ queryKey: getListActasQueryKey(empresaId) });
          toast({ title: `Acta v${data.version} generada con IA` });
        },
        onError: () => toast({ title: "Error al generar el acta", variant: "destructive" }),
      }
    );
  }

  async function downloadAs(format: "doc" | "pdf") {
    if (!lastResult?.acta_id) return;
    const ext = format === "pdf" ? "pdf" : "docx";
    setDownloadingFormat(format);
    try {
      const resp = await fetch(`${API_BASE}/api/actas/${lastResult.acta_id}/exportar?formato=${ext}`);
      if (!resp.ok) throw new Error("Error generating document");
      const driveUrl = resp.headers.get("X-Drive-Url");
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const version = lastResult.version ?? 1;
      const tipo = lastResult.tipo_comite ?? "COPASST";
      a.download = `Acta_${tipo}_v${version}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      if (driveUrl) {
        setActaDriveUrl(driveUrl);
        qc.invalidateQueries({ queryKey: getListActasQueryKey(empresaId) });
      }
      toast({ title: driveUrl ? "Documento guardado en Drive" : `Acta .${ext} descargada` });
    } catch {
      toast({ title: "Error al generar el documento", variant: "destructive" });
    } finally {
      setDownloadingFormat(null);
    }
  }

  function handleUploadActa(file: File) {
    if (!file || !lastResult?.acta_id) return;
    setUploadActaStatus("uploading");
    setUploadDriveUrl(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        const resp = await fetch(`${API_BASE}/api/actas/${lastResult.acta_id}/subir-firmada`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_base64: base64,
            file_name: file.name,
            mime_type: file.type || "application/pdf",
          }),
        });
        if (!resp.ok) throw new Error("Drive upload failed");
        const result = await resp.json() as { drive_url: string };
        setUploadActaStatus("success");
        setUploadDriveUrl(result.drive_url);
        qc.invalidateQueries({ queryKey: getListActasQueryKey(empresaId) });
        toast({ title: `Acta firmada guardada en Drive` });
      } catch {
        setUploadActaStatus("error");
        toast({ title: "Error al subir el archivo a Drive", variant: "destructive" });
      }
    };
    reader.onerror = () => {
      setUploadActaStatus("error");
      toast({ title: "Error al leer el archivo", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Actas de Comité"
        subtitulo="COPASST y Comité de Convivencia · Generación con IA"
        driveModule="actas_copasst"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Nueva Acta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tipo de Comité</Label>
                <Select
                  value={tipoComite}
                  onValueChange={(v) => { setTipoComite(v as "COPASST" | "convivencia"); setValue("tipo_comite", v as "COPASST" | "convivencia"); }}
                >
                  <SelectTrigger data-testid="select-tipo-comite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COPASST">COPASST</SelectItem>
                    <SelectItem value="convivencia">Comité de Convivencia Laboral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" data-testid="input-fecha-acta" {...register("fecha", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lugar</Label>
                  <Input placeholder="Sala de reuniones" data-testid="input-lugar" {...register("lugar", { required: true })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hora inicio</Label>
                  <Input type="time" data-testid="input-hora-inicio" {...register("hora_inicio", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora fin</Label>
                  <Input type="time" data-testid="input-hora-fin" {...register("hora_fin", { required: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Asistentes</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => addAsistente({ nombre: "", cargo: "" })} data-testid="btn-add-asistente">
                    <Plus className="h-3.5 w-3.5 mr-1" />Agregar
                  </Button>
                </div>
                {asistentes.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input placeholder="Nombre" className="flex-1" {...register(`asistentes.${i}.nombre`)} />
                    <Input placeholder="Cargo" className="flex-1" {...register(`asistentes.${i}.cargo`)} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeAsistente(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Puntos del Orden del Día</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => addPunto({ texto: "" })} data-testid="btn-add-punto">
                    <Plus className="h-3.5 w-3.5 mr-1" />Agregar
                  </Button>
                </div>
                {puntos.map((f, i) => (
                  <div key={f.id} className="flex gap-2">
                    <Input placeholder={`Punto ${i + 1}`} className="flex-1" {...register(`puntos.${i}.texto`)} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removePunto(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="transcripcion">Transcripción de la reunión (opcional)</Label>
                <Textarea
                  id="transcripcion"
                  rows={3}
                  placeholder="Pegue aquí la transcripción o notas de la reunión para enriquecer el acta generada..."
                  {...register("transcripcion")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={generar.isPending} data-testid="btn-generar-acta">
                <Sparkles className="h-4 w-4 mr-2" />
                {generar.isPending ? "Generando con IA..." : "Generar Acta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {lastResult && (
          <Card className="border-primary/30 overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ScrollText className="h-5 w-5 text-primary" />
                    Acta {lastResult.numero_acta}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {lastResult.tipo_comite} · {lastResult.fecha} · <span className="font-semibold text-primary">v{lastResult.version}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAs("doc")}
                      disabled={!!downloadingFormat}
                      title="Descargar .docx"
                      data-testid="btn-download-acta-docx"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      {downloadingFormat === "doc" ? "…" : ".doc"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadAs("pdf")}
                      disabled={!!downloadingFormat}
                      title="Descargar PDF"
                      data-testid="btn-download-acta-pdf"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      {downloadingFormat === "pdf" ? "…" : ".pdf"}
                    </Button>
                  </div>
                  {actaDriveUrl && (
                    <a href={actaDriveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                      <ExternalLink className="h-3 w-3" />Ver en Drive
                    </a>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(lastResult.compromisos) && lastResult.compromisos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Compromisos</p>
                  <ul className="text-sm space-y-2">
                    {(lastResult.compromisos as unknown[]).map((c, i) => {
                      const obj = typeof c === "string" ? null : (c as Record<string, unknown>);
                      const descripcion = obj ? (obj.descripcion as string) ?? JSON.stringify(c) : (c as string);
                      const responsable = obj?.responsable as string | undefined;
                      const fechaLimite = obj?.fecha_limite as string | undefined;
                      const numero = obj?.numero as number | undefined;
                      return (
                        <li key={i} className="flex gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">{numero ?? i + 1}</span>
                          <div className="flex-1">
                            <p className="leading-snug">{descripcion}</p>
                            {(responsable || fechaLimite) && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {responsable && <span>Responsable: <strong>{responsable}</strong></span>}
                                {responsable && fechaLimite && " · "}
                                {fechaLimite && <span>Fecha límite: <strong>{fechaLimite}</strong></span>}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {lastResult.texto_acta_completo && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Texto del Acta</p>
                  <div className="max-h-48 overflow-y-auto rounded border bg-muted/30 p-3">
                    <pre className="text-xs whitespace-pre-wrap font-sans">{lastResult.texto_acta_completo}</pre>
                  </div>
                </div>
              )}

              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <CloudUpload className="h-3.5 w-3.5" />
                  Cargar documento firmado en Drive
                </p>
                <div
                  className="border border-dashed rounded-md p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors text-sm text-muted-foreground"
                  onClick={() => uploadActaStatus !== "uploading" && fileRef.current?.click()}
                >
                  {uploadActaStatus === "uploading"
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Subiendo a Drive…</>
                    : <><Upload className="h-4 w-4" />Seleccionar acta firmada (PDF)</>
                  }
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadActa(f); e.target.value = ""; }}
                />
                {uploadActaStatus === "success" && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Documento guardado en Drive.</span>
                    {uploadDriveUrl && (
                      <a href={uploadDriveUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 underline">
                        <ExternalLink className="h-3 w-3" />Abrir
                      </a>
                    )}
                  </div>
                )}
                {uploadActaStatus === "error" && (
                  <p className="mt-2 text-xs text-red-600">Error al subir el archivo. Intente de nuevo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de Actas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comité</TableHead>
                  <TableHead>Número / Versión</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Drive</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!actas || actas.length === 0) ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Sin actas registradas</TableCell></TableRow>
                ) : actas.map((a) => (
                  <TableRow key={a.id} data-testid={`acta-row-${a.id}`}>
                    <TableCell className="text-sm font-medium">{a.tipo_comite ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      <span>{a.numero_acta ?? "—"}</span>
                      {a.version != null && (
                        <span className="ml-2 text-xs text-primary font-semibold">v{a.version}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{a.fecha_reunion ? new Date(a.fecha_reunion).toLocaleDateString("es-CO") : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${ESTADO_COLORS[a.estado ?? "borrador"]}`}>
                        {a.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      {a.drive_url ? (
                        <a href={a.drive_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-700 hover:underline">
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
