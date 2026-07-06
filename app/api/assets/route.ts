import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AssetType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get("projectId");
  const folderId = searchParams.get("folderId");
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const favorite = searchParams.get("favorite");
  const q = searchParams.get("q");

  const where: Prisma.AssetWhereInput = {};
  if (projectId) where.projectId = projectId;
  if (folderId) where.folderId = folderId;
  if (type && type in AssetType) where.type = type as AssetType;
  if (tag) where.tags = { has: tag };
  if (favorite === "true") where.favorite = true;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const assets = await prisma.asset.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";

  if (!name || !(type in AssetType)) {
    return NextResponse.json(
      { error: "name and a valid type are required" },
      { status: 400 },
    );
  }

  const asset = await prisma.asset.create({
    data: {
      name,
      type: type as AssetType,
      projectId: typeof body.projectId === "string" ? body.projectId : null,
      folderId: typeof body.folderId === "string" ? body.folderId : null,
      prompt: typeof body.prompt === "string" ? body.prompt : null,
      negativePrompt: typeof body.negativePrompt === "string" ? body.negativePrompt : null,
      thumbnailUrl: typeof body.thumbnailUrl === "string" ? body.thumbnailUrl : null,
      fileUrl: typeof body.fileUrl === "string" ? body.fileUrl : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      tags: Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string") : [],
      metadata: body.metadata ?? undefined,
    },
  });
  return NextResponse.json({ asset }, { status: 201 });
}
