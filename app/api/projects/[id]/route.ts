import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assets: { orderBy: { createdAt: "desc" } },
      folders: true,
      scenes: { orderBy: { order: "asc" } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const data: {
    name?: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    status?: string;
  } = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string" || body.description === null) {
    data.description = body.description;
  }
  if (typeof body.thumbnailUrl === "string" || body.thumbnailUrl === null) {
    data.thumbnailUrl = body.thumbnailUrl;
  }
  if (typeof body.status === "string") data.status = body.status;

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ project });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
