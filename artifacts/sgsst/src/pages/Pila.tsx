import { useParams } from "wouter";
import { useState, useRef } from "react";
import {
  useProcesarPila,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEMO_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

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

  const procesar = useProcesarPila();

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
    const b64 = await readFileAsBase64(file);
    procesar.mutate(
      { data: { empresa_id: empresaId, periodo, pdf_base64: b64 } },
      {
        onSuccess: (data) => {
          setLastResult(data);
          toast({ title: "Planilla PILA procesada con IA" });
        },
        onError: () => toast({ title: "Error al procesar la planilla", variant: "destructive" }),
      }
    );
  }

  const numAfiliados = lastResult?.num_afiliados as Record<string, number> | undefined;
  const alertas = lastResult?.alertas as string[] | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planillas PILA</h1>
        <p className="text-sm text-muted-foreground mt-1">Procesamiento de pagos de seguridad social con IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Cargar Planilla PILA
            </CardTitle>
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
              data-testid="drop-zone-pila"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Arrastre la planilla PILA en PDF aquí<br />o haga clic para seleccionar
              </p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {procesar.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Skeleton className="h-4 w-4 rounded-full" />
                Analizando planilla con IA...
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

      <Card>
        <CardHeader><CardTitle className="text-base">Instrucciones</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Seleccione el período correspondiente a la planilla PILA.</p>
          <p>2. Cargue el PDF de la planilla descargado del operador de información (SOI, Aportes en Línea, Simple, Mi Planilla).</p>
          <p>3. La IA extraerá automáticamente: número de afiliados por sistema, valores pagados y posibles alertas de validación.</p>
          <p>4. Los datos quedan registrados para el seguimiento de afiliaciones de la empresa.</p>
        </CardContent>
      </Card>
    </div>
  );
}
