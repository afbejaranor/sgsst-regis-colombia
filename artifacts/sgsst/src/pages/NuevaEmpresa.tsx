import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useCreateEmpresa } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, ArrowLeft, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FormValues {
  nombre: string;
  nit: string;
  codigo_ciiu: string;
  descripcion_actividad: string;
  tamano: string;
  num_empleados: string;
  direccion: string;
  ciudad: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_whatsapp: string;
  nivel_sgsst: string;
}

const CIUDADES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
  "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
  "Manizales", "Villavicencio", "Pasto", "Montería", "Armenia",
  "Valledupar", "Neiva", "Popayán", "Sincelejo", "Tunja",
];

const TAMANOS = [
  { value: "micro", label: "Microempresa (1-10 trabajadores)" },
  { value: "pequeña", label: "Pequeña (11-50 trabajadores)" },
  { value: "mediana", label: "Mediana (51-200 trabajadores)" },
  { value: "grande", label: "Grande (más de 200 trabajadores)" },
];

const NIVELES_SGSST = [
  { value: "minimo", label: "Mínimo (≤10 trabajadores)" },
  { value: "basico", label: "Básico (11-50 trabajadores)" },
  { value: "estandar", label: "Estándar (51-200 trabajadores)" },
  { value: "avanzado", label: "Avanzado (+200 / alto riesgo)" },
];

function calcNivelNormativo(numEmpleados: number | string): { nivel: "7" | "21" | "60"; label: string; color: string } {
  const n = Number(numEmpleados);
  if (!n || n <= 10) return { nivel: "7", label: "7 Estándares · Básico (Art. 9 Res. 0312)", color: "bg-blue-50 text-blue-700 border-blue-200" };
  if (n <= 50) return { nivel: "21", label: "21 Estándares · Estándar (Art. 14 Res. 0312)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { nivel: "60", label: "60 Estándares · Avanzado (Art. 27 Res. 0312)", color: "bg-amber-50 text-amber-700 border-amber-200" };
}

export default function NuevaEmpresa() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createEmpresa = useCreateEmpresa();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      nombre: "",
      nit: "",
      codigo_ciiu: "",
      descripcion_actividad: "",
      tamano: "pequeña",
      num_empleados: "",
      direccion: "",
      ciudad: "Bogotá",
      contacto_nombre: "",
      contacto_email: "",
      contacto_whatsapp: "",
      nivel_sgsst: "estandar",
    },
  });

  const numEmpleadosWatch = watch("num_empleados");
  const nivelInfo = calcNivelNormativo(numEmpleadosWatch);

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Solo los administradores pueden registrar nuevas empresas.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver
        </Button>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    createEmpresa.mutate(
      {
        data: {
          nombre: values.nombre,
          nit: values.nit,
          codigo_ciiu: values.codigo_ciiu,
          descripcion_actividad: values.descripcion_actividad || undefined,
          tamano: values.tamano || undefined,
          num_empleados: values.num_empleados ? Number(values.num_empleados) : undefined,
          direccion: values.direccion || undefined,
          ciudad: values.ciudad || undefined,
          contacto_nombre: values.contacto_nombre || undefined,
          contacto_email: values.contacto_email || undefined,
          contacto_whatsapp: values.contacto_whatsapp || undefined,
          nivel_sgsst: values.nivel_sgsst || undefined,
          nivel_normativo: calcNivelNormativo(values.num_empleados).nivel,
        },
      },
      {
        onSuccess: (empresa) => {
          qc.invalidateQueries({ queryKey: ["listEmpresas"] });
          toast({ title: `Empresa "${empresa.nombre}" registrada exitosamente` });
          navigate(`/empresa/${empresa.id}`);
        },
        onError: () => {
          toast({ title: "Error al registrar la empresa", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Empresa Cliente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registre la información de la empresa para comenzar la asesoría SG-SST</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Información Legal
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="nombre">
                Razón Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej. Constructora Andina SAS"
                data-testid="input-nombre"
                {...register("nombre", { required: "La razón social es requerida" })}
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nit">
                NIT <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nit"
                placeholder="Ej. 900123456-1"
                data-testid="input-nit"
                {...register("nit", {
                  required: "El NIT es requerido",
                  pattern: { value: /^\d{6,10}-\d$/, message: "Formato: XXXXXXXXXX-D" },
                })}
              />
              {errors.nit && <p className="text-xs text-red-500">{errors.nit.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="codigo_ciiu">
                Código CIIU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo_ciiu"
                placeholder="Ej. 4711"
                maxLength={6}
                data-testid="input-ciiu"
                {...register("codigo_ciiu", {
                  required: "El código CIIU es requerido",
                  pattern: { value: /^\d{4,6}$/, message: "4 a 6 dígitos" },
                })}
              />
              {errors.codigo_ciiu && <p className="text-xs text-red-500">{errors.codigo_ciiu.message}</p>}
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="descripcion_actividad">Actividad económica</Label>
              <Textarea
                id="descripcion_actividad"
                rows={2}
                placeholder="Descripción de la actividad económica principal"
                {...register("descripcion_actividad")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tamaño y Nivel SG-SST</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Tamaño de empresa</Label>
              <Select
                value={watch("tamano")}
                onValueChange={(v) => setValue("tamano", v)}
              >
                <SelectTrigger data-testid="select-tamano">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAMANOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="num_empleados">N.° de trabajadores</Label>
              <Input
                id="num_empleados"
                type="number"
                min={1}
                max={99999}
                placeholder="Ej. 45"
                {...register("num_empleados")}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Perfil Normativo (Res. 0312)</Label>
              <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium ${nivelInfo.color}`}>
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{nivelInfo.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Auto-calculado según N.° de trabajadores</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ciudad</Label>
              <Select
                value={watch("ciudad")}
                onValueChange={(v) => setValue("ciudad", v)}
              >
                <SelectTrigger data-testid="select-ciudad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CIUDADES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Ej. Cra 15 # 72-45, Chapinero"
                {...register("direccion")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contacto_nombre">Nombre del contacto</Label>
              <Input
                id="contacto_nombre"
                placeholder="Ej. María García"
                {...register("contacto_nombre")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contacto_email">Correo electrónico</Label>
              <Input
                id="contacto_email"
                type="email"
                placeholder="correo@empresa.com"
                {...register("contacto_email", {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Correo inválido" },
                })}
              />
              {errors.contacto_email && <p className="text-xs text-red-500">{errors.contacto_email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contacto_whatsapp">WhatsApp / Teléfono</Label>
              <Input
                id="contacto_whatsapp"
                placeholder="Ej. 3001234567"
                {...register("contacto_whatsapp")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={createEmpresa.isPending}
            data-testid="btn-guardar-empresa"
          >
            <Save className="h-4 w-4 mr-2" />
            {createEmpresa.isPending ? "Guardando…" : "Registrar Empresa"}
          </Button>
        </div>
      </form>
    </div>
  );
}
