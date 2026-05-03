# SG-SST Regis Colombia

## Overview

Plataforma de gestión de Seguridad y Salud en el Trabajo (SG-SST) para consultores colombianos. Permite gestionar múltiples empresas cliente, rastrear cumplimiento Res. 0312, procesar exámenes médicos con IA, generar matrices GTC-45, actas de comité y procesar planillas PILA.

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS (artifacts/sgsst, port 22309, previewPath `/`)
- **Backend**: Express 5 (artifacts/api-server, port 8080, previewPath `/api`)
- **AI**: OpenRouter API (`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`)
- **Database**: Supabase (external PostgreSQL) — NOTE: tables not yet migrated to Supabase; demo data served from in-memory fallback
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

### Frontend Pages (wouter routing)
- `/dashboard` — Overview all companies, compliance % semaphore
- `/empresa/:id` — Company detail with Res.0312 compliance gauge + all 7 standards
- `/empresa/:id/examenes` — Medical exams (PDF upload → AI extraction)
- `/empresa/:id/matrices` — GTC-45 risk matrix (AI generation by CIIU code)
- `/empresa/:id/actas` — Committee minutes (AI generation)
- `/empresa/:id/pila` — PILA payroll PDF processing (AI extraction)
- `/empresa/:id/comites` — Active committees with vigency tracking

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

### Supabase DB Setup
Tables: `empresas`, `trabajadores`, `documentos_cumplimiento`, `examenes_medicos`, `matrices_riesgo`, `actas_comite`, `comites`, `registros_pila`

**IMPORTANT**: Supabase tables need to be created manually via Supabase dashboard SQL editor. The `SUPABASE_URL` secret includes `/rest/v1/` suffix — the client strips this automatically in `artifacts/api-server/src/lib/supabase.ts`.

Until tables are created in Supabase, the app uses in-memory demo data from `artifacts/api-server/src/lib/demo-data.ts`.

### Demo Company
- ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Name: Comercializadora Demo SAS
- NIT: 900123456-1
- CIIU: 4711

## Secrets Required
- `OPENROUTER_API_KEY` — OpenRouter API for AI features
- `SUPABASE_URL` — Supabase project URL (includes /rest/v1/ suffix, stripped in client)
- `SUPABASE_ANON_KEY` — Supabase anon key (not currently used)
- `SUPABASE_SERVICE_KEY` — Supabase service key (used server-side)
- `SESSION_SECRET` — Express session secret
