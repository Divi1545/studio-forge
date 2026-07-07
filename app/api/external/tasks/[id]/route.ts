import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { timingSafeEqual } from "node:crypto";

function authorized(req: NextRequest): boolean {
  const configured = process.env.EXTERNAL_API_KEY;
  if (!configured) return false; // fail closed when no key is configured
  const provided = req.headers.get("x-api-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(configured);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await prisma.externalTask.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, fileUrl: true, thumbnailUrl: true, type: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: task.id,
    status: task.status,
    taskType: task.taskType,
    outputUrl: task.asset?.fileUrl ?? null,
    note: task.note,
    createdAt: task.createdAt,
    decidedAt: task.decidedAt,
    completedAt: task.completedAt,
  });
}
