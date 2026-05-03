import { useGetDashboardResumen, getGetDashboardResumenQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Percent, AlertCircle, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export default function Dashboard() {
  const { data: dashboardData, isLoading, error } = useGetDashboardResumen({
    query: { queryKey: getGetDashboardResumenQueryKey() }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <AlertCircle className="h-12 w-12 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">No se pudo cargar el resumen. Verifique la conexión al servidor.</p>
      </div>
    );
  }

  const empresas = dashboardData.empresas ?? [];
  const alertasCount = empresas.filter(
    (e) => e.nivel_semaforo === "rojo" || e.nivel_semaforo === "amarillo"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="dashboard-title">
          Dashboard de Consultor
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Resumen de cumplimiento SG-SST · Res. 0312 de 2019
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="card-total-empresas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Asesoradas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.total_empresas}</div>
            <p className="text-xs text-muted-foreground mt-1">empresas activas</p>
          </CardContent>
        </Card>

        <Card data-testid="card-promedio">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cumplimiento Promedio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold",
              (dashboardData.promedio_cumplimiento ?? 0) >= 90 ? "text-emerald-700" :
              (dashboardData.promedio_cumplimiento ?? 0) >= 60 ? "text-amber-600" : "text-red-600"
            )}>
              {dashboardData.promedio_cumplimiento}%
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full",
                  (dashboardData.promedio_cumplimiento ?? 0) >= 90 ? "bg-emerald-500" :
                  (dashboardData.promedio_cumplimiento ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${dashboardData.promedio_cumplimiento ?? 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-alertas">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requieren Atención</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alertasCount}</div>
            <p className="text-xs text-muted-foreground mt-1">empresas en nivel crítico o moderado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado de Empresas · Res. 0312</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead className="w-48">Cumplimiento</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead className="text-right">Pendientes</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    Sin empresas registradas
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow
                    key={empresa.id}
                    className="cursor-pointer hover:bg-muted/50"
                    data-testid={`empresa-row-${empresa.id}`}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/empresa/${empresa.id ?? DEMO_ID}`} className="hover:underline">
                        {empresa.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{empresa.nit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={cn("h-1.5 rounded-full",
                              (empresa.porcentaje_cumplimiento ?? 0) >= 90 ? "bg-emerald-500" :
                              (empresa.porcentaje_cumplimiento ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${empresa.porcentaje_cumplimiento ?? 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-10 text-right">
                          {empresa.porcentaje_cumplimiento}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {empresa.nivel_semaforo === "verde" && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs">Aceptable</Badge>
                      )}
                      {empresa.nivel_semaforo === "amarillo" && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">Mod. Aceptable</Badge>
                      )}
                      {empresa.nivel_semaforo === "rojo" && (
                        <Badge variant="destructive" className="text-xs">Crítico</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className={cn("font-medium", (empresa.criterios_pendientes ?? 0) > 0 ? "text-red-600" : "text-emerald-600")}>
                        {empresa.criterios_pendientes}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/empresa/${empresa.id ?? DEMO_ID}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
