@AGENTS.md

# StudioForge

Private, self-hosted AI creative production studio owned by AI Code Agency Pvt Ltd. Single-admin tool — not public SaaS, no billing/credits/multi-tenant. Replaces cost tracking with a real-USD cost meter per generation.

## Stack

- Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, shadcn/ui, lucide-react
- Dark theme only: background `#0A0A0B`, zinc surfaces, teal accent `#14B8A6`. Fonts: Inter (UI), Barlow (numeric/data).
- DB: PostgreSQL via Prisma (`prisma/schema.prisma`)
- Queue: BullMQ + Redis (`workers/render-worker.ts`)
- Storage: S3-compatible abstraction (`lib/storage.ts`) — MinIO locally, Cloudflare R2 in production. Never write provider outputs straight to disk.
- Auth: single-admin, `ADMIN_PASSWORD` env var + iron-session cookie (`lib/auth.ts`, `proxy.ts`). No NextAuth, no signup flow.
- AI reasoning: Anthropic Claude only, via `lib/anthropic.ts` (`complete`, `completeJSON`, `analyzeImage`). Never OpenAI for reasoning/planning/prompt compilation.
- Generation providers (FAL, ElevenLabs, Suno) sit behind `lib/router.ts` and are never called directly from routes or referenced by name in UI/API code — only task types (e.g. `image.generate`, `video.image2video`) are used outside `lib/providers/`.

## Architecture principles

- **Cost-first generation**: every generate action shows a `CostBadge` (estimated USD) before firing. Nothing generates without the estimate shown.
- **Queue everything long-running**: API routes only enqueue a `RenderJob` and return a job ID. Clients poll `/api/jobs/[id]` or subscribe via SSE (`/api/jobs/stream`). Providers are never called synchronously from a route handler.
- **Approval gates**: AI Director plans, marketing/shorts/explainer runs, and externally-submitted tasks (Authority13) all require explicit human approval before any generation spend.
- **Universal asset system**: every generated artifact (image/video/audio/script/etc.) is saved as an `Asset` with full metadata, versioned via `parentAssetId`. Consistency (character/location identity lock) is handled by `lib/consistency.ts`, not ad hoc per module.
- **Provider swap = routing table edit only.** No provider or model name may appear in UI components or API routes.

## Directory map

- `app/(dashboard)/*` — the 16 authenticated modules (Explore, Image, Video, Audio, Director, Cinema, Plugins, Marketing, Shorts, Explainer, Originals, Canvas, Influencer, Apps, Assets, Projects), wrapped by `app/(dashboard)/layout.tsx` (sidebar + auth check).
- `app/login` — unauthenticated admin login (server action in `actions.ts`).
- `proxy.ts` — session gate for all routes except `/login` and `/api/external/*`.
- `lib/` — cross-cutting server logic: `auth.ts`, `storage.ts`, `anthropic.ts`, and (from Phase 2 on) `router.ts`, `promptCompiler.ts`, `consistency.ts`, `cameraPresets.ts`, `ffmpeg.ts`, `providers/*`.
- `workers/render-worker.ts` — BullMQ worker; the only place provider adapters are actually invoked.
- `prisma/schema.prisma` — all data models (populated starting Phase 1).

## Build status

Built in strict sequential phases with a hard stop after each one for approval — see `STUDIOFORGE_MASTER_CURSOR_PROMPT.md` (original spec, kept at repo root) for the full phase map. Current status: **Phase 0 complete** (scaffold, auth, dark shell, storage/Anthropic wrappers, docker-compose). Phases 1–10 not yet started.

## Do NOT

- Use OpenAI for any reasoning, planning, or prompt compilation.
- Use the name "Higgsfield" or any of its assets/copy anywhere.
- Hardcode a provider or model name in a UI component or API route — router task types only.
- Call a generation provider synchronously from an API route — everything through BullMQ.
- Build billing/credits/subscriptions.
- Auto-execute externally-submitted tasks — approval gate always applies.
- Use localStorage for state — DB + server state only.

## Known spec discrepancy

The master spec hardcodes the reasoning model as `claude-sonnet-4-6`, which does not match any real Anthropic model ID. `lib/anthropic.ts` defaults to `claude-sonnet-5` via the `ANTHROPIC_MODEL` env var instead — confirm the intended model before changing this.
