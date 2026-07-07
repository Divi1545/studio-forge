import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { timingSafeEqual } from "node:crypto";

// External task intake (Authority13 and other trusted systems).
// Tasks are NEVER auto-executed — they land in the approval queue with
// status PENDING_APPROVAL and a human approves the spend in the UI.
// proxy.ts exempts /api/external/* from the session gate, so this route
// must enforce its own key auth.

const VALID_TASK_TYPES = new Set([
  "image.generate",
  "video.text2video",
  "video.image2video",
  "audio.tts",
  "audio.music",
]);

function authorized(req: NextRequest): boolean {
  const configured = process.env.EXTERNAL_API_KEY;
  if (!configured) return false; // fail closed when no key is configured
  const provided = req.headers.get("x-api-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(configured);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    source?: unknown;
    taskType?: unknown;
    prompt?: unknown;
    requestedBy?: unknown;
    metadata?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const taskType = typeof body.taskType === "string" ? body.taskType : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!VALID_TASK_TYPES.has(taskType)) {
    return NextResponse.json(
      { error: `taskType must be one of: ${[...VALID_TASK_TYPES].join(", ")}` },
      { status: 400 }
    );
  }
  if (!prompt || prompt.length > 10_000) {
    return NextResponse.json(
      { error: "prompt is required (max 10000 chars)" },
      { status: 400 }
    );
  }

  const task = await prisma.externalTask.create({
    data: {
      source: typeof body.source === "string" ? body.source.slice(0, 100) : "unknown",
      taskType,
      prompt,
      requestedBy:
        typeof body.requestedBy === "string" ? body.requestedBy.slice(0, 200) : "unknown",
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as object)
          : undefined,
    },
  });

  return NextResponse.json(
    { id: task.id, status: task.status },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.externalTask.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      source: true,
      taskType: true,
      requestedBy: true,
      status: true,
      createdAt: true,
      decidedAt: true,
    },
  });

  return NextResponse.json({ tasks });
}
