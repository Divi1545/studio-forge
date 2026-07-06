# MASTER CURSOR PROMPT — StudioForge (Private AI Creative Studio)

Paste everything below this line into Cursor as a single prompt.

---

## Context

New standalone project: **StudioForge** — a private, self-hosted AI creative production studio owned by AI Code Agency Pvt Ltd. It replicates the full workflow of commercial multi-model creative suites (image studio, video studio, audio studio, agentic AI Director, cinema timeline, marketing/shorts/explainer studios, asset system, canvas, AI influencer, apps marketplace, projects) — but runs privately, uses raw provider APIs at cost (no credit markup), and integrates with the Authority13 AI workforce OS as a peer platform.

- Repo: new repo `studioforge` (GitHub: Divi1545/studioforge)
- Deployment target: **private local first** (Docker Compose on Divindu's machine), Railway later if needed
- This is a single-user/admin private tool at launch — NOT public SaaS. Do not build billing, credits, or multi-tenant plans. Build a **cost meter** instead (real USD API cost per generation).
- Branding: StudioForge is an ORIGINAL product. Never use the name "Higgsfield", their logos, UI assets, marketing copy, or scraped content anywhere in code, UI, or metadata.

## Task

Build StudioForge end-to-end as a modular monolith with 16 modules, a universal asset system, a provider-agnostic AI router, a BullMQ render queue, and an Anthropic-powered AI Director agent. Work in strict sequential phases with hard stop points. Do not skip ahead. At the end of each phase: run the build, fix all TypeScript errors, commit, push to GitHub, then STOP and wait for approval before the next phase.

## Requirements — Global Stack (non-negotiable)

- Next.js 15 App Router, TypeScript strict, Tailwind CSS, shadcn/ui, lucide-react
- Dark theme default: near-black background `#0A0A0B`, zinc surfaces, single accent `#14B8A6` (teal — matches Kiyanna brand family). Font: Inter for UI, Barlow for numeric/data displays.
- DB: PostgreSQL via **Prisma** (local Docker Postgres; `DATABASE_URL` swappable to Supabase later — no Supabase-only features in core paths)
- Queue: **BullMQ + Redis** (same pattern as Authority13's `workers/task-worker.ts`)
- Storage: S3-compatible abstraction (`lib/storage.ts`) — MinIO in Docker locally, Cloudflare R2 in production. Never write provider outputs to local disk directly; always through the storage adapter.
- Auth: single-admin local auth — `ADMIN_PASSWORD` env var, iron-session cookie. No NextAuth, no signup flows.
- **AI reasoning: Anthropic Claude API ONLY — model `claude-sonnet-4-6` — for ALL internal logic** (AI Director, prompt compilation, vision analysis, script writing, shot lists). NEVER OpenAI for reasoning.
- Generation providers (media endpoints only, all behind the router — never called directly from routes):
  - **FAL AI** (`fal.ai` serverless): Kling video, Seedance video, Wan video, Flux image, plus upscale/interpolation endpoints
  - **ElevenLabs**: TTS, voice clone, SFX — audio output format `pcm_22050` where device-bound, `mp3_44100_128` for web playback
  - **Suno API**: music generation
  - **Anthropic vision** (claude-sonnet-4-6 image input): analysis, captioning, continuity checks
- Every provider call must be wrapped in try/catch, logged to a `generation_logs` table with cost, latency, provider, model, status.
- All long-running generation goes through the BullMQ queue — API routes only enqueue and return a job ID; the client polls `/api/jobs/[id]` or subscribes via SSE.
- Environment: `.env.example` must list every var. `docker-compose.yml` must bring up: app, postgres, redis, minio, worker.

## Files to Create — Phase Map

### PHASE 0 — Scaffold + Infrastructure (STOP after)

- `docker-compose.yml` — postgres:16, redis:7, minio, app (dev), worker
- `package.json` — scripts: `dev`, `worker` (tsx `workers/render-worker.ts`), `db:push`, `db:migrate`, `db:seed`, `build`
- `.env.example` — DATABASE_URL, REDIS_URL, ADMIN_PASSWORD, SESSION_SECRET, ANTHROPIC_API_KEY, FAL_KEY, ELEVENLABS_API_KEY, SUNO_API_KEY, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, AUTHORITY13_URL, AUTHORITY13_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
- `app/layout.tsx` — dark shell, left sidebar nav with all 16 modules (Explore, Image, Video, Audio, AI Director, Cinema Studio, Plugins, Marketing Studio, Shorts Studio, Explainer, Originals, Canvas, AI Influencer, Apps, Assets, Projects)
- `app/login/page.tsx` + `lib/auth.ts` — iron-session admin login, middleware protecting all routes
- `lib/storage.ts` — S3 adapter: `putObject`, `getSignedUrl`, `deleteObject`
- `lib/anthropic.ts` — Claude wrapper: `complete()`, `completeJSON()` (strips markdown fences, parses, retries once on parse fail), `analyzeImage()`
- `CLAUDE.md` — project context file following AI Code Agency standard structure

### PHASE 1 — Database Schema + Universal Asset System (STOP after)

`prisma/schema.prisma` — models:

- `Project` — id, name, description, thumbnailUrl, status, createdAt, updatedAt
- `Asset` — the universal record. Fields: id, projectId?, type (enum: CHARACTER, LOCATION, PROP, CREATURE, STORYBOARD, SCENE, IMAGE, VIDEO, AUDIO, VOICE, MUSIC, SCRIPT, TEMPLATE, INFLUENCER), name, thumbnailUrl, fileUrl, prompt, negativePrompt, modelUsed, provider, tags (String[]), folderId?, favorite (Boolean), notes, metadata (Json — module-specific fields), version (Int), parentAssetId? (version chain), createdAt, lastUsedAt
- `Folder` — id, name, parentId?, projectId?
- `Scene` — id, projectId, order, title, script, prompt, status (DRAFT→ASSETS_READY→PROMPTED→RENDERING→REVIEW→APPROVED), linked assets via `SceneAsset` join, outputVideoAssetId?, durationSec, cameraPreset, notes
- `RenderJob` — id, sceneId?, assetId?, type (IMAGE, VIDEO, AUDIO, MUSIC, UPSCALE, LIPSYNC, INTERPOLATE), provider, model, inputPayload (Json), status (QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED), outputUrl?, costUsd (Decimal), latencyMs, errorMessage?, bullJobId, createdAt, completedAt
- `GenerationLog` — id, renderJobId?, provider, model, promptTokens?, outputUnits?, costUsd, status, raw (Json), createdAt
- `DirectorRun` — id, projectId, brief (Text), plan (Json — scenes, characters, props, locations, shot list), status (PLANNING, AWAITING_APPROVAL, EXECUTING, PAUSED, DONE, FAILED), estimatedCostUsd, actualCostUsd, currentStep, createdAt
- `PromptTemplate` — id, module, name, schema (Json — form field definitions), compilerInstructions (Text), isBuiltIn
- `Plugin` — id, name, providerKey, baseUrl, enabled, config (Json)
- `AppListing` — id, name, description, type (TEMPLATE, CHARACTER_PACK, PROMPT_PACK, WORKFLOW, STYLE), payload (Json), installCount

Also build:
- `app/assets/page.tsx` — full asset browser: folder tree sidebar, grid with thumbnails, filter by type/tags/favorite, search, drag into folders, detail drawer showing all metadata + version history + "linked scenes"
- `app/projects/page.tsx` + `app/projects/[id]/page.tsx` — project dashboard with sections: Characters, Locations, Props, Creatures, Storyboards, Scripts, Audio, Videos, Timeline, Exports, Versions, Assets (tabbed)
- `app/api/assets/*` CRUD, `app/api/projects/*` CRUD
- `db:seed` — 1 demo project, sample folders, built-in PromptTemplates (see Phase 3)

### PHASE 2 — AI Router + Provider Adapters + Render Queue (STOP after)

- `lib/router.ts` — the AI Router. Signature: `route(task: RouteTask): Promise<RenderJob>`. Task types map to provider+model via a `routing table` stored in DB (Plugin/config) with hardcoded defaults:
  - image.generate → FAL Flux
  - image.upscale → FAL upscaler
  - video.image2video → FAL Kling (default) | Seedance | Wan selectable
  - video.text2video → FAL Seedance
  - video.lipsync → FAL lipsync endpoint
  - video.interpolate / video.extend → FAL
  - audio.tts / audio.voiceclone / audio.sfx → ElevenLabs
  - music.generate → Suno
  - reasoning.* / vision.* → Anthropic claude-sonnet-4-6 (direct, not queued)
  - No provider name may appear in any UI component or API route — only task types. Swapping a provider = editing the routing table only.
- `lib/providers/fal.ts`, `lib/providers/elevenlabs.ts`, `lib/providers/suno.ts` — each exports `submit()`, `poll()`, `estimateCostUsd(payload)`. Include per-model cost constants in one file `lib/providers/pricing.ts` with a comment: "update from provider pricing pages".
- `workers/render-worker.ts` — BullMQ worker: picks up RenderJob, calls adapter, polls provider, uploads output to storage, updates RenderJob + Asset, writes GenerationLog, emits Authority13 event `studioforge.render.completed|failed`, sends Telegram alert on completion/failure.
- `app/api/jobs/[id]/route.ts` — job status. `app/api/jobs/stream/route.ts` — SSE stream of job updates.
- `components/CostBadge.tsx` — shows estimated USD before any generate button fires; every generate action must display cost first (mirror of the approve-spend-then-render pattern).

### PHASE 3 — Image Studio + Prompt Template Compiler (STOP after)

- `app/image/page.tsx` — tabbed studio: **Character Builder, Location Builder, Prop Builder, Creature Builder, Storyboard Frames, Freeform**
- Each builder is a **form, not a textarea**. Form schemas (stored as built-in PromptTemplates):
  - Character: age, gender, height, hair, eyes, skin, expression, outfit, accessories, lighting, background, views (front/side/back/¾ multi-view sheet toggle), identityLock (reference image upload), negativePrompt
  - Location: type, mood, weather, timeOfDay, messiness, keyObjects, lighting, aspectRatio, negativePrompt
  - Prop: category (car/weapon/furniture/phone/jewelry/custom), material, era, condition, lighting, background, negativePrompt
  - Creature: species base, size, texture, mood, environment, realism level, negativePrompt
  - Storyboard: sceneDescription, panelCount, style (sketch/cinematic/anime), aspectRatio
- `lib/promptCompiler.ts` — takes form values + template `compilerInstructions`, calls claude-sonnet-4-6 to compile a full professional generation prompt (positive + negative). Show compiled prompt in a collapsible "Advanced" panel — editable before submission.
- **Identity Lock / character consistency**: when identityLock reference exists, pass it as image reference to the FAL model that supports image reference; store reference URL in asset metadata; every future generation of that character auto-attaches it. Build `lib/consistency.ts` for this.
- Every output auto-saves as Asset with full metadata, versioned. "Generate variation" creates child version.
- Expression sheets / outfit changes / aging: buttons on a Character asset detail page that pre-fill the form from stored metadata and change only the delta.

### PHASE 4 — Video Studio (STOP after)

- `app/video/page.tsx` — modes as tabs: Image→Video, Text→Video, Video→Video, Scene Continuation, Lip Sync, Extend, Upscale/4K, Interpolation, Loop, Inpainting, Outpainting, Reframe
- Camera Motion control: preset picker (dolly in/out, crash zoom, pan, tilt, orbit/360, bullet-time, handheld, crane, static) + lens (focal length) + movement speed. Presets compile into the video prompt via `promptCompiler`. Store ~30 presets in `lib/cameraPresets.ts` as structured objects (name, promptFragment, thumbnailDescription).
- First-frame / last-frame reference inputs (image asset picker from the Asset system).
- Scene Continuation: pick a previous video asset → extract last frame (ffmpeg in worker) → use as first-frame reference for next generation.
- Every mode: cost badge → enqueue → SSE progress → output saved as VIDEO asset linked to source assets.
- Install ffmpeg in the worker Docker image; `lib/ffmpeg.ts` helpers: extractLastFrame, concat, resize/reframe, loop.

### PHASE 5 — Audio Studio (STOP after)

- `app/audio/page.tsx` — tabs: Voice Generation (TTS), Voice Clone, Dialogue (multi-speaker script → per-line TTS → stitched), Sound Effects, Music (Suno), Room Ambience, Narration, Podcast (two-host script generator via Claude → dual-voice render)
- Voice library: VOICE assets storing ElevenLabs voice IDs + preview clips.
- Dialogue mode: paste or generate script with speaker labels; Claude splits lines; worker renders each line and stitches with ffmpeg; output single AUDIO asset + per-line assets.

### PHASE 6 — AI Director (the "Supercomputer") (STOP after)

This is the differentiator. `app/director/page.tsx` + `lib/director/`.

- Chat-style interface. User types a brief in plain language (e.g. "one-minute short film about a teenager obsessed with magical TV worlds while his mother calls him for dinner").
- **Plan step** (`lib/director/planner.ts`): claude-sonnet-4-6 with a structured system prompt returns strict JSON: `{ title, logline, characters[], locations[], props[], creatures[], scenes[{ order, description, durationSec, cameraPreset, dialogue[], requiredAssetRefs[] }], voiceover, music, estimatedGenerations }`. Compute `estimatedCostUsd` from pricing table.
- **Approval gate**: plan renders as an interactive review board (editable scene cards, asset checklist, total cost). Nothing generates until Divindu clicks Approve. This mirrors the Authority13 approval-ladder pattern — reuse the same UX language.
- **Execution step** (`lib/director/executor.ts`): a state machine that walks the plan: generate character sheets → locations → props → per-scene hero frames (image) → per-scene video (image→video with camera preset) → dialogue/VO audio → music → assemble timeline in Cinema Studio. Each step = RenderJobs through the router. Continuity: character/location assets are reused as references in every scene (consistency.ts). Progress streams via SSE; PAUSE and RESUME buttons; failed step retries once then pauses the run.
- **Analysis mode**: upload a video/image/project → claude vision analyzes characters, props, locations, timeline structure → outputs shot list, lighting notes, prompt suggestions, story critique.
- Persist everything in `DirectorRun`.

### PHASE 7 — Cinema Studio (timeline) (STOP after)

- `app/cinema/[projectId]/page.tsx` — the big page: left = Scene List (ordered, status pills matching the Scene state machine), center = Preview player + Timeline (horizontal track: video clips, audio track, music track — drag to reorder, trim handles), right = Prompt Editor + Assets panel + Camera Presets + Render Queue tab.
- Scene lifecycle UI: Scene → Assets → Prompt → Video → Render → Review → Continue (next scene inherits continuity references).
- Timeline export: worker ffmpeg concat of approved scene videos + audio mix → final MP4 → EXPORT asset + entry in project Exports. 1080p default, 4K via upscale task.
- Render Queue panel: live list of RenderJobs for this project (SSE), cancel button.

### PHASE 8 — Marketing Studio + Shorts Studio + Explainer (STOP after)

- `app/marketing/page.tsx` — input: product URL or manual product form. Worker fetches URL, Claude extracts product name/description/images → offers creative directions (UGC-style, CGI commercial, cinematic narrative, wildcard) → selected direction becomes a mini Director run producing: script, hook variants, voiceover, ad video, caption pack. Output formats: FB/IG feed 1:1, Reels/TikTok 9:16, LinkedIn 16:9, YouTube. Optional: push finished creative to Meta Ads via the connected Meta MCP later — leave a stub `lib/integrations/metaAds.ts` with a TODO, do not implement now.
- `app/shorts/page.tsx` — 9:16 pipeline: topic/script → scenes → vertical video → auto-subtitles (Claude transcript from script or Whisper on uploaded audio) burned in via ffmpeg drawtext/ASS, trending-hook generator (Claude), auto-resize any existing landscape asset to 9:16 with smart reframe.
- `app/explainer/page.tsx` — tutorial/product-demo generator: script → storyboard frames → simple motion (image→video slow push) → narration VO → assembled explainer. Whiteboard style = Storyboard builder style preset.

### PHASE 9 — Explore, Originals, Canvas, AI Influencer, Apps, Plugins (STOP after)

- `app/explore/page.tsx` — featured templates, trending prompts (from most-used PromptTemplates), recently used assets, tutorials (markdown pages), example projects.
- `app/originals/page.tsx` — library of finished exports: collections, watch page with player, version list.
- `app/canvas/page.tsx` — ReactFlow visual workspace (same lib as Authority13): nodes = assets (character/location/prop/scene/video/audio), edges = "used in" relationships; drag from asset panel; clicking a scene node opens it in Cinema Studio. Save canvas layout per project (Json on Project).
- `app/influencer/page.tsx` — persistent virtual character workflow: create INFLUENCER asset (Character Builder + identity lock mandatory) → generate lifestyle shoot packs (outfit/pose/location grids), talking videos (TTS + lipsync task), Instagram pack export (zip of images + captions via Claude). Add a visible disclaimer in the UI: AI-generated faces in paid ads may require rights review.
- `app/apps/page.tsx` — local marketplace: publish/install AppListings (template packs, character packs, prompt packs, workflows, styles) — install copies payload into user templates/assets. Local-only for now.
- `app/plugins/page.tsx` — routing table editor UI: view/edit provider mappings, enable/disable providers, add API keys (encrypted at rest with SESSION_SECRET-derived key), test-connection button per provider. Future rows pre-seeded disabled: Runway, Luma, ComfyUI, Stable Diffusion local.

### PHASE 10 — Authority13 Integration + Hardening (STOP after)

- `lib/integrations/authority13.ts` — emit lifecycle events to `${AUTHORITY13_URL}/api/external/events` with `AUTHORITY13_API_KEY` header for: director.run.started/awaiting_approval/completed, render.completed/failed, export.completed, dailyCostSummary. NEVER change the existing event contract shape used by other platforms — additive fields only.
- Inbound: `app/api/external/tasks/route.ts` — Authority13 agents can enqueue StudioForge tasks (e.g. Growth Agent requests "3 IslandLoaf Instagram reels about Galle stays") → creates a DirectorRun in AWAITING_APPROVAL. Human approval always required before generation spend — no auto-execute from external tasks.
- Telegram daily summary (cron in worker): renders completed, total cost USD, failures.
- Hardening: rate-limit generate endpoints, global error boundary, empty states on every page, mobile-responsive check on Assets/Projects/Director pages, `README.md` with docker-compose quickstart.

## Output Expectations

- `docker compose up` brings the entire studio up locally; login with ADMIN_PASSWORD; all 16 nav items load with functional or clearly-stubbed states as per phase progress.
- Every generation flow: form → compiled prompt (editable) → cost badge → approve → queued → SSE progress → asset saved with full metadata → visible in Assets + Project.
- Provider swap requires zero code changes outside `lib/providers/` + routing table.
- A full AI Director run from one-line brief to assembled timeline works end-to-end with human approval gates.
- Real API cost visible per job, per project, per day.

## Do NOT

- Do NOT use OpenAI for any reasoning, planning, or prompt compilation — Anthropic claude-sonnet-4-6 only. (OpenAI may appear ONLY as a disabled future row in Plugins.)
- Do NOT use the name "Higgsfield" or any of their assets/copy anywhere.
- Do NOT hardcode any provider or model name in UI components or API routes — router task types only.
- Do NOT call providers synchronously from API routes — everything through BullMQ.
- Do NOT build billing/credits/subscriptions — this is private; build cost tracking only.
- Do NOT auto-execute externally-submitted tasks — approval gate always.
- Do NOT use localStorage for state — DB + server state only.
- Do NOT skip a phase or continue past a STOP point without explicit approval.
- Do NOT break the standard Authority13 `/api/external/events` contract — additive only.

## Push to GitHub

After every phase: `git add -A && git commit -m "phase N: <summary>" && git push origin main` → remote `Divi1545/studioforge`. Create the repo on first push if it doesn't exist.
