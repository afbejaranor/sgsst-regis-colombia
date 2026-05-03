import { useParams } from "wouter";
import { useState } from "react";
import {
  useGetEmpresa,
  useGetCumplimiento,
  useUpdateCriterio,
  getGetCumplimientoQueryKey,
  getGetEmpresaQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, ChevronDown, ChevronRight, FolderOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DRIVE_FOLDERS, DRIVE_ROOT } from "@/lib/drive-config";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function ComplianceGauge({ pct }: { pct: number }) {
  const color = pct >= 90 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const stroke = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center justify-center" data-testid="compliance-gauge">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={`${stroke} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="65" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
        <text x="70" y="85" textAnchor="middle" fontSize="11" fill="#6b7280">
          {pct >= 90 ? "Aceptable" : pct >= 60 ? "Mod. Aceptable" : "Crítico"}
        </text>
      </svg>
    </div>
  );
}

const ESTADO_LABELS: Record<string, string> = {
  cumple: "Cumple",
  no_cumple: "No Cumple",
  en_proceso: "En Proceso",
  no_aplica: "No Aplica",
};

const ESTADO_COLORS: Record<string, string> = {
  cumple: "bg-emerald-100 text-emerald-800 border-emerald-200",
  no_cumple: "bg-red-100 text-red-800 border-red-200",
  en_proceso: "bg-amber-100 text-amber-800 border-amber-200",
  no_aplica: "bg-gray-100 text-gray-500 border-gray-200",
};

function StandardRow({
  est,
  empresaId,
  driveUrl,
}: {
  est: NonNullable<ReturnType<typeof useGetCumplimiento>["data"]>["estandares"][0];
  empresaId: string;
  driveUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateCriterio();

  const pct = est.puntaje_posible > 0
    ? Math.round((est.puntaje_obtenido / est.puntaje_posible) * 100)
    : 0;

  const barColor = pct >= 90 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";

  function handleEstadoChange(criterioId: string, newEstado: string) {
    update.mutate(
      { empresaId, criterioId, data: { estado: newEstado as "cumple" | "no_cumple" | "en_proceso" | "no_aplica" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCumplimientoQueryKey(empresaId) });
          toast({ title: "Criterio actualizado" });
        },
        onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
      }
    );
  }

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => setOpen(!open)}
        data-testid={`standard-row-${est.estandar}`}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {est.estandar}
          </div>
        </TableCell>
        <TableCell className="w-44">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className={cn("h-2 rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-sm font-semibold w-10 text-right">{pct}%</span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <span className="text-emerald-700 font-medium">{est.criterios_cumplidos}</span>
          {" / "}
          <span className="text-red-700">{est.criterios_incumplidos}</span>
          {" / "}
          <span className="text-amber-700">{est.criterios_en_proceso}</span>
        </TableCell>
        <TableCell className="text-right text-sm text-muted-foreground">
          {est.puntaje_obtenido.toFixed(1)} / {est.puntaje_posible.toFixed(1)} pts
        </TableCell>
        <TableCell className="text-center w-20">
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            title="Ver evidencias en Drive"
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </a>
        </TableCell>
      </TableRow>
      {open && est.criterios.map((c) => (
        <TableRow key={c.id} className="bg-muted/20" data-testid={`criterio-row-${c.id}`}>
          <TableCell colSpan={2} className="pl-10 text-xs text-foreground/80">
            <span className="font-mono text-muted-foreground mr-2">{c.criterio_codigo}</span>
            {c.criterio_descripcion}
          </TableCell>
          <TableCell className="text-center text-xs text-muted-foreground">{c.peso_porcentual} pts</TableCell>
          <TableCell className="text-right">
            <Select
              defaultValue={c.estado ?? "no_cumple"}
              onValueChange={(v) => handleEstadoChange(c.id!, v)}
            >
              <SelectTrigger className={cn("h-7 text-xs w-36 border", ESTADO_COLORS[c.estado ?? "no_cumple"])} data-testid={`select-estado-${c.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cumple">Cumple</SelectItem>
                <SelectItem value="no_cumple">No Cumple</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="no_aplica">No Aplica</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell className="text-center">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              title="Evidencia en Drive"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function EmpresaDetail() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;

  const { data: empresa, isLoading: loadingEmpresa } = useGetEmpresa(empresaId, {
    query: { queryKey: getGetEmpresaQueryKey(empresaId) },
  });
  const { data: cumplimiento, isLoading: loadingCumpl } = useGetCumplimiento(empresaId, {
    query: { queryKey: getGetCumplimientoQueryKey(empresaId) },
  });

  const driveUrl = DRIVE_FOLDERS[empresaId]?.raiz ?? DRIVE_ROOT;

  if (loadingEmpresa || loadingCumpl) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40" /><Skeleton className="h-40" /><Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="empresa-nombre">{empresa?.nombre}</h1>
          <p className="text-muted-foreground text-sm mt-1">NIT: {empresa?.nit} · CIIU: {empresa?.codigo_ciiu}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">{empresa?.tamano}</Badge>
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-100"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Drive
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center py-4">
          <ComplianceGauge pct={cumplimiento?.porcentaje_total ?? 0} />
          <p className="text-sm text-muted-foreground mt-2">Cumplimiento Res. 0312</p>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Información General</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{empresa?.nombre}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{empresa?.ciudad}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{empresa?.num_empleados} trabajadores</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Resumen de Puntaje</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Puntaje Obtenido</span>
              <span className="font-bold text-emerald-700">{cumplimiento?.puntaje_total?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nivel</span>
              <span className="font-semibold">{cumplimiento?.nivel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estándares</span>
              <span>{cumplimiento?.estandares?.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estándares Mínimos · Resolución 0312 de 2019</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Cumplidos / No Cumplidos / En Proceso · Haga clic en un estándar para ver criterios</p>
            </div>
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Ver evidencias
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estándar</TableHead>
                <TableHead className="w-44">Avance</TableHead>
                <TableHead className="text-center">C / NC / EP</TableHead>
                <TableHead className="text-right">Puntaje</TableHead>
                <TableHead className="text-center w-20">Evidencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cumplimiento?.estandares ?? []).map((est) => (
                <StandardRow key={est.estandar} est={est} empresaId={empresaId} driveUrl={driveUrl} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
