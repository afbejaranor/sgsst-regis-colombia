import { useParams } from "wouter";
import { useListComites, getListComitesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShieldCheck, Heart, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyPageHeader } from "@/components/CompanyPageHeader";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function VigencyBar({ inicio, fin }: { inicio: string; fin: string }) {
  const start = new Date(inicio).getTime();
  const end = new Date(fin).getTime();
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const daysLeft = daysUntil(fin);
  const color = daysLeft > 180 ? "bg-emerald-500" : daysLeft > 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{new Date(inicio).toLocaleDateString("es-CO")}</span>
        <span>{new Date(fin).toLocaleDateString("es-CO")}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn("text-xs font-medium", daysLeft > 180 ? "text-emerald-700" : daysLeft > 60 ? "text-amber-700" : "text-red-700")}>
        {daysLeft > 0 ? `${daysLeft} días restantes` : "Período vencido"}
      </p>
    </div>
  );
}

export default function Comites() {
  const params = useParams<{ id: string }>();
  const empresaId = params.id ?? DEMO_ID;

  const { data: comites, isLoading } = useListComites(empresaId, {
    query: { queryKey: getListComitesQueryKey(empresaId) },
  });

  const copasst = comites?.find((c) => c.tipo === "COPASST");
  const convivencia = comites?.find((c) => c.tipo === "convivencia");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" /><Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyPageHeader
        empresaId={empresaId}
        titulo="Comités Activos"
        subtitulo="COPASST y Comité de Convivencia Laboral · Vigencias y estado"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-copasst">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                COPASST
              </CardTitle>
              {copasst ? (
                <Badge className={cn("text-xs", copasst.activo ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400")}>
                  {copasst.activo ? "Activo" : "Inactivo"}
                </Badge>
              ) : <Badge variant="outline" className="text-gray-500">No configurado</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">Comité Paritario de Seguridad y Salud en el Trabajo</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {copasst ? (
              <>
                <VigencyBar inicio={copasst.vigencia_inicio!} fin={copasst.vigencia_fin!} />
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Inicio: {new Date(copasst.vigencia_inicio!).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Fin: {new Date(copasst.vigencia_fin!).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
                  <strong>Obligatorio para empresas con 10 o más trabajadores.</strong> El período es de 2 años. Requiere elección de representantes de trabajadores.
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay COPASST configurado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-convivencia">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Comité de Convivencia
              </CardTitle>
              {convivencia ? (
                <Badge className={cn("text-xs", convivencia.activo ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400")}>
                  {convivencia.activo ? "Activo" : "Inactivo"}
                </Badge>
              ) : <Badge variant="outline" className="text-gray-500">No configurado</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">Comité de Convivencia Laboral · Res. 652/2012</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {convivencia ? (
              <>
                <VigencyBar inicio={convivencia.vigencia_inicio!} fin={convivencia.vigencia_fin!} />
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Inicio: {new Date(convivencia.vigencia_inicio!).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Fin: {new Date(convivencia.vigencia_fin!).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-rose-50 border border-rose-200 rounded p-3">
                  <strong>Obligatorio para todas las empresas.</strong> Período de 2 años. Previene el acoso laboral y promueve el ambiente de trabajo sano.
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay Comité de Convivencia configurado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Obligaciones Legales</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="font-semibold text-foreground">COPASST</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Reunión ordinaria mensual (máx. 12 al año)</li>
                <li>Inspecciones de seguridad trimestrales</li>
                <li>Registro de actas de todas las reuniones</li>
                <li>Investigación de accidentes e incidentes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">Comité de Convivencia</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Reunión ordinaria trimestral</li>
                <li>Atención de quejas de acoso laboral</li>
                <li>Medidas correctivas y preventivas</li>
                <li>Informe anual a alta dirección</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
