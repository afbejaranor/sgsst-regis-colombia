import { useGetEmpresa } from "@workspace/api-client-react";
import { Building2, ExternalLink } from "lucide-react";
import { DRIVE_FOLDERS, DRIVE_ROOT } from "@/lib/drive-config";

interface CompanyPageHeaderProps {
  empresaId: string;
  titulo: string;
  subtitulo?: string;
  driveModule?: keyof ReturnType<typeof getDriveFolders>;
}

function getDriveFolders(empresaId: string) {
  return DRIVE_FOLDERS[empresaId] ?? {
    raiz: DRIVE_ROOT, pila: DRIVE_ROOT, examenes: DRIVE_ROOT,
    matrices: DRIVE_ROOT, actas_copasst: DRIVE_ROOT,
    actas_convivencia: DRIVE_ROOT, plan_prevencion: DRIVE_ROOT, politicas: DRIVE_ROOT,
  };
}

export function CompanyPageHeader({ empresaId, titulo, subtitulo, driveModule }: CompanyPageHeaderProps) {
  const { data: empresa } = useGetEmpresa(empresaId);
  const folders = getDriveFolders(empresaId);
  const driveUrl = driveModule ? folders[driveModule] : folders.raiz;

  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
          <Building2 className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground/70">{empresa?.nombre ?? "—"}</span>
          <span>·</span>
          <span>NIT: {empresa?.nit ?? "—"}</span>
          <span>·</span>
          <span>CIIU: {empresa?.codigo_ciiu ?? "—"}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>}
      </div>
      <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-md hover:bg-blue-100"
        title="Abrir carpeta en Google Drive"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Carpeta Drive
      </a>
    </div>
  );
}
