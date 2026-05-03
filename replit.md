# SG-SST Regis Colombia

## Overview

Plataforma de gestión de Seguridad y Salud en el Trabajo (SG-SST) para consultores colombianos. Permite gestionar múltiples empresas cliente, rastrear cumplimiento Res. 0312, procesar exámenes médicos con IA, generar matrices GTC-45, actas de comité y procesar planillas PILA.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS (artifacts/sgsst, port 22309, previewPath `/`)
- **Backend**: Express 5 (artifacts/api-server, port 8080, previewPath `/api`)
- **AI**: OpenRouter API (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`)
- **Database**: Supabase (external PostgreSQL) — NOTE: tables not yet migrated; demo data served from in-memory fallback in `demo-data.ts`
- **API Spec**: OpenAPI at `lib/api-spec/openapi.yaml`
- **Codegen**: Orval generates React Query hooks into `lib/api-client-react/src/generated/api.ts`

## Key Commands

```bash
pnpm --filter @workspace/api-server run dev    # Start API server
pnpm --filter @workspace/sgsst run dev         # Start frontend
pnpm --filter @workspace/api-spec run codegen  # Regenerate API client
pnpm run typecheck                             # Full typecheck
```

## Architecture

### Auth System
- `artifacts/sgsst/src/contexts/AuthContext.tsx` — localStorage-based auth, 3 demo users
- `artifacts/sgsst/src/pages/Login.tsx` — Login page at `/login`
- Auth guard: `RequireAuth` in `Router.tsx` redirects unauthenticated users to `/login`
- Roles: `admin` (all companies), `consultor` (assigned companies), `empresa` (single company)

Demo users:
| Usuario | Contraseña | Rol | Acceso |
|---------|-----------|-----|--------|
| admin | admin123 | Administrador | Todas las empresas |
| carlos.perez | consultor123 | Consultor | Constructora Andina + Clínica Santa Lucía |
| empresa1 | empresa123 | Empresa | Comercializadora Demo SAS |

### Frontend Pages (wouter routing)
- `/login` — Login page (public)
- `/dashboard` — Overview all companies, compliance % semaphore
- `/empresa/:id` — Company detail with Res.0312 compliance gauge + standards (+ evidence Drive links)
- `/empresa/:id/plan` — Plan de Acción (AI-generated improvement tasks)
- `/empresa/:id/examenes` — Medical exams (PDF upload → AI extraction + Drive docs list)
- `/empresa/:id/matrices` — GTC-45 risk matrix (AI generation by CIIU, pre-filled)
- `/empresa/:id/actas` — Committee minutes (AI generation + transcript + .doc/.pdf download)
- `/empresa/:id/pila` — PILA payroll with tracking table + PDF processing
- `/empresa/:id/comites` — Active committees with vigency tracking

### Shared Components
- `artifacts/sgsst/src/components/CompanyPageHeader.tsx` — Standard header with empresa name + NIT + CIIU + Drive folder link
- `artifacts/sgsst/src/lib/drive-config.ts` — Drive root URL, folder mapping per company, dummy docs

### Backend Routes (all under `/api`)
- `GET /api/dashboard/resumen` — Dashboard summary all companies
- `GET /api/empresas/` — List companies
- `GET /api/empresas/:id` — Single company
- `GET /api/cumplimiento/:empresaId` — Compliance by company (all 7 standards + criteria)
- `PATCH /api/cumplimiento/:empresaId/criterio/:criterioId` — Update criterion status
- `GET /api/trabajadores/:empresaId` — Workers
- `POST /api/examenes/procesar` — AI process medical exam PDF
- `GET /api/examenes/:empresaId` — List exams
- `POST /api/matrices/generar` — AI generate GTC-45 matrix
- `GET /api/matrices/:empresaId` — List matrices
- `POST /api/actas/generar` — AI generate committee minutes
- `GET /api/actas/:empresaId` — List minutes
- `POST /api/pila/procesar` — AI process PILA PDF
- `GET /api/comites/:empresaId` — List active committees
- `GET /api/plan-accion/:empresaId` — Get plan de acción (AI-generated)
- `POST /api/plan-accion/:empresaId/generar` — Generate plan de acción with AI

### Demo Companies (in-memory)
| ID | Nombre | CIIU | Cumplimiento |
|----|--------|------|-------------|
| a1b2c3d4-... | Comercializadora Demo SAS | 4711 | 29.1% (Crítico) |
| b2c3d4e5-... | Constructora Andina SAS | 4111 | 67.5% (Mod. Aceptable) |
| c3d4e5f6-... | Clínica Santa Lucía Ltda | 8610 | 95.5% (Aceptable) |

### Google Drive Integration (Simulated)
- Root folder: https://drive.google.com/drive/u/0/folders/1-SdLdLriDUl3TFiTSJHllBsfjC1jk9Lf
- All folder links point to root (real subfolder creation requires Google Drive OAuth)
- Dummy document lists shown per company per module (examenes, pila, matrices, actas)
- Upload simulation: shows success/error message when file is dropped

### Compliance Thresholds (Res. 0312)
- ≥ 90%: Aceptable (green)
- ≥ 60%: Moderadamente Aceptable (amber)
- < 60%: Crítico (red)

## Secrets Required
- `OPENROUTER_API_KEY` — OpenRouter API for AI features
- `SUPABASE_URL` — Supabase project URL (includes /rest/v1/ suffix, stripped in client)
- `SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_KEY` — Supabase service key (used server-side)
- `SESSION_SECRET` — Express session secret
