import { useParams } from "wouter";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Plus, Trash2, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface FormValues {
  tipo_comite: "COPASST" | "convivencia";
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string;
  asistentes: { nombre: string; cargo: string }[];
  puntos: { texto: string }[];
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
  const [lastResult, setLastResult] = useState<NonNullable<ReturnType<typeof useGenerarActa>["data"]> | null>(null);
  const [tipoComite, setTipoComite] = useState<"COPASST" | "convivencia">("COPASST");

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
        },
      },
      {
        onSuccess: (data) => {
          setLastResult(data);
          qc.invalidateQueries({ queryKey: getListActasQueryKey(empresaId) });
          toast({ title: "Acta generada con IA" });
        },
        onError: () => toast({ title: "Error al generar el acta", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actas de Comité</h1>
        <p className="text-sm text-muted-foreground mt-1">COPASST y Comité de Convivencia · Generación con IA</p>
      </div>

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
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Acta {lastResult.numero_acta}
              </CardTitle>
              <p className="text-xs text-muted-foreground capitalize">{lastResult.tipo_comite} · {lastResult.fecha}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(lastResult.compromisos) && lastResult.compromisos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Compromisos</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {(lastResult.compromisos as string[]).map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
              {lastResult.texto_acta_completo && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Texto del Acta</p>
                  <div className="max-h-64 overflow-y-auto rounded border bg-muted/30 p-3">
                    <pre className="text-xs whitespace-pre-wrap font-sans">{lastResult.texto_acta_completo}</pre>
                  </div>
                </div>
              )}
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
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!actas || actas.length === 0) ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10">Sin actas registradas</TableCell></TableRow>
                ) : actas.map((a) => (
                  <TableRow key={a.id} data-testid={`acta-row-${a.id}`}>
                    <TableCell className="font-mono text-sm">{a.numero_acta}</TableCell>
                    <TableCell className="text-sm">{a.fecha_reunion ? new Date(a.fecha_reunion).toLocaleDateString("es-CO") : "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${ESTADO_COLORS[a.estado ?? "borrador"]}`}>
                        {a.estado}
                      </span>
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
