import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      childVersions: { orderBy: { version: "asc" } },
      parentAsset: true,
      sceneAssets: { include: { scene: true } },
    },
  });
  if (!asset) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ asset });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const data: {
    name?: string;
    folderId?: string | null;
    favorite?: boolean;
    notes?: string | null;
    tags?: string[];
    lastUsedAt?: Date;
  } = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.folderId === "string" || body.folderId === null) data.folderId = body.folderId;
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;
  if (typeof body.notes === "string" || body.notes === null) data.notes = body.notes;
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.filter((t: unknown): t is string => typeof t === "string");
  }
  if (body.touch === true) data.lastUsedAt = new Date();

  const asset = await prisma.asset.update({ where: { id }, data });
  return NextResponse.json({ asset });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
