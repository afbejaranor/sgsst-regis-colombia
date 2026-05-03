import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles, Target, Clock, User, CheckCircle2, AlertCircle, AlertTriangle,
  TrendingUp, ChevronDown, ChevronRight, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Accion {
  criterio_id: string;
  criterio_codigo: string;
  criterio_descripcion: string;
  estandar: string;
  estado: "no_cumple" | "en_proceso";
  peso_porcentual: number;
  prioridad: "Alta" | "Media" | "Baja";
  recomendacion: string | null;
  responsable_sugerido: string | null;
  plazo_sugerido: string | null;
  recurso_estimado: string | null;
  indicador_verificacion: string | null;
}

interface PlanData {
  empresa_id: string;
  empresa_nombre: string;
  total_pendientes: number;
  impacto_potencial: number;
  plan_generado: boolean;
  objetivo_general: string | null;
  meta_porcentaje_estimado: number | null;
  observacion_general: string | null;
  acciones: Accion[];
}

const PRIORIDAD_CONFIG = {
  Alta: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
  Media: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertTriangle },
  Baja: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
};

const PLAZO_LABELS: Record<string, string> = {
  inmediato: "Inmediato",
  "1_mes": "1 mes",
  "3_meses": "3 meses",
  "6_meses": "6 meses",
};

const ESTADO_BADGE: Record<string, string> = {
  no_cumple: "bg-red-100 text-red-700",
  en_proceso: "bg-amber-100 text-amber-700",
};

function AccionRow({ accion, generado }: { accion: Accion; generado: boolean }) {
  const [open, setOpen] = useState(false);
  const cfg = PRIORIDAD_CONFIG[accion.prioridad] ?? PRIORIDAD_CONFIG.Media;
  const Icon = cfg.icon;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-shrink-0 mt-0.5">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{accion.criterio_codigo}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ESTADO_BADGE[accion.estado])}>
              {accion.estado === "no_cumple" ? "No Cumple" : "En Proceso"}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", cfg.color)}>
              <Icon className="h-2.5 w-2.5 mr-1" />
              {accion.prioridad}
            </Badge>
            <span className="text-xs text-muted-foreground">{accion.peso_porcentual} pts</span>
          </div>
          <p className="text-sm mt-1 text-foreground/90 leading-snug">{accion.criterio_descripcion}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{accion.estandar}</p>
        </div>

        {accion.plazo_sugerido && (
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {PLAZO_LABELS[accion.plazo_sugerido] ?? accion.plazo_sugerido}
          </div>
        )}
      </button>

      {open && generado && accion.recomendacion && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Acción recomendada</p>
            <p className="text-sm">{accion.recomendacion}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {accion.responsable_sugerido && (
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <User className="h-3 w-3" /> Responsable
                </div>
                <p className="text-xs font-medium">{accion.responsable_sugerido}</p>
              </div>
            )}
            {accion.plazo_sugerido && (
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <Clock className="h-3 w-3" /> Plazo
                </div>
                <p className="text-xs font-medium">{PLAZO_LABELS[accion.plazo_sugerido] ?? accion.plazo_sugerido}</p>
              </div>
            )}
            {accion.recurso_estimado && (
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Recurso</div>
                <p className="text-xs font-medium">{accion.recurso_estimado}</p>
              </div>
            )}
          </div>
          {accion.indicador_verificacion && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Indicador de verificación</p>
              <p className="text-xs text-foreground/80">{accion.indicador_verificacion}</p>
            </div>
          )}
        </div>
      )}

      {open && !generado && (
        <div className="border-t bg-muted/20 px-4 py-3">
          <p className="text-xs text-muted-foreground italic">Genere el plan con IA para ver recomendaciones detalladas.</p>
        </div>
      )}
    </div>
  );
}

export default function PlanAccion() {
  const { id: empresaId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PlanData>({
    queryKey: ["plan-accion", empresaId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/plan-accion/${empresaId}`);
      if (!res.ok) throw new Error("Error al cargar plan de acción");
      return res.json();
    },
    enabled: !!empresaId,
  });

  const generar = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/plan-accion/${empresaId}/generar`, { method: "POST" });
      if (!res.ok) throw new Error("Error al generar plan");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-accion", empresaId] });
      toast({ title: "Plan de acción generado con IA" });
    },
    onError: () => toast({ title: "Error al generar plan", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const altas = data.acciones.filter((a) => a.prioridad === "Alta");
  const medias = data.acciones.filter((a) => a.prioridad === "Media");
  const bajas = data.acciones.filter((a) => a.prioridad === "Baja");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Plan de Acción"
        subtitulo="Mejora continua · Res. 0312 de 2019"
        driveModule="politicas"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-red-600">{data.total_pendientes}</p>
            <p className="text-xs text-muted-foreground">criterios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Impacto potencial</p>
            <p className="text-2xl font-bold text-amber-600">+{data.impacto_potencial}</p>
            <p className="text-xs text-muted-foreground">puntos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Prioridad Alta</p>
            <p className="text-2xl font-bold text-red-500">{altas.length}</p>
            <p className="text-xs text-muted-foreground">acciones críticas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Meta estimada</p>
            <p className="text-2xl font-bold text-emerald-600">
              {data.plan_generado && data.meta_porcentaje_estimado ? `${data.meta_porcentaje_estimado}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">con plan completo</p>
          </CardContent>
        </Card>
      </div>

      {/* Objetivo / Observación general */}
      {data.plan_generado && data.objetivo_general && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Objetivo general del plan</p>
                <p className="text-sm mt-0.5 text-foreground/80">{data.objetivo_general}</p>
                {data.observacion_general && (
                  <p className="text-xs text-muted-foreground mt-1">{data.observacion_general}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate button */}
      {!data.plan_generado && (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 flex flex-col items-center gap-3">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Generar plan de acción con IA</p>
              <p className="text-sm text-muted-foreground mt-1">
                La IA analizará los {data.total_pendientes} criterios pendientes y generará
                recomendaciones concretas con responsables, plazos e indicadores.
              </p>
            </div>
            <Button
              onClick={() => generar.mutate()}
              disabled={generar.isPending}
              className="bg-[#064E3B] hover:bg-[#064E3B]/90"
            >
              {generar.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generar con IA</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {data.plan_generado && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generar.mutate()}
            disabled={generar.isPending}
          >
            {generar.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Regenerando...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerar plan</>
            )}
          </Button>
        </div>
      )}

      {/* Acciones por prioridad */}
      {altas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-sm text-red-600">Prioridad Alta ({altas.length})</h2>
            <span className="text-xs text-muted-foreground">— Acción inmediata o en 1 mes</span>
          </div>
          <div className="space-y-2">
            {altas.map((a) => <AccionRow key={a.criterio_id} accion={a} generado={data.plan_generado} />)}
          </div>
        </div>
      )}

      {medias.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-sm text-amber-600">Prioridad Media ({medias.length})</h2>
            <span className="text-xs text-muted-foreground">— Implementar en 1–3 meses</span>
          </div>
          <div className="space-y-2">
            {medias.map((a) => <AccionRow key={a.criterio_id} accion={a} generado={data.plan_generado} />)}
          </div>
        </div>
      )}

      {bajas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h2 className="font-semibold text-sm text-blue-600">Prioridad Baja ({bajas.length})</h2>
            <span className="text-xs text-muted-foreground">— Incluir en plan de mejora 6 meses</span>
          </div>
          <div className="space-y-2">
            {bajas.map((a) => <AccionRow key={a.criterio_id} accion={a} generado={data.plan_generado} />)}
          </div>
        </div>
      )}

      {data.total_pendientes === 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-6 pb-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="font-semibold text-emerald-700">¡Sin pendientes!</p>
            <p className="text-sm text-muted-foreground text-center">
              Esta empresa cumple con todos los criterios evaluados. Mantenga la documentación actualizada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
