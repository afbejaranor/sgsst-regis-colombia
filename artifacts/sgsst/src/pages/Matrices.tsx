import { useParams } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useGenerarMatriz,
  useListMatrices,
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
import { ShieldAlert, Sparkles, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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
  const [lastResult, setLastResult] = useState<NonNullable<ReturnType<typeof useGenerarMatriz>["data"]> | null>(null);

  const generar = useGenerarMatriz();
  const { data: matrices, isLoading } = useListMatrices(empresaId, {
    query: { queryKey: getListMatricesQueryKey(empresaId) },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { ciiu: "4711", num_empleados: "45", procesos: "", descripcion: "" },
  });

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
          setLastResult(data);
          qc.invalidateQueries({ queryKey: getListMatricesQueryKey(empresaId) });
          toast({ title: "Matriz GTC-45 generada con IA" });
        },
        onError: () => toast({ title: "Error al generar la matriz", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Matriz de Peligros y Riesgos</h1>
        <p className="text-sm text-muted-foreground mt-1">GTC-45 · Generación con IA por código CIIU</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Generar Matriz GTC-45
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="space-y-1.5">
                <Label htmlFor="procesos">Procesos principales</Label>
                <Textarea
                  id="procesos"
                  rows={2}
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
              <Button type="submit" className="w-full" disabled={generar.isPending} data-testid="btn-generar-matriz">
                <Sparkles className="h-4 w-4 mr-2" />
                {generar.isPending ? "Generando con IA..." : "Generar Matriz"}
              </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!matrices || matrices.length === 0) ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-10">Sin matrices generadas</TableCell></TableRow>
                ) : matrices.map((m) => (
                  <TableRow key={m.id} data-testid={`matriz-row-${m.id}`}>
                    <TableCell className="text-sm">{new Date(m.created_at!).toLocaleDateString("es-CO")}</TableCell>
                    <TableCell className="font-mono text-sm">{m.codigo_ciiu}</TableCell>
                    <TableCell className="text-sm">v{m.version}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{m.estado}</Badge>
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
