import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; parentId?: string | null } = {};

  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.parentId === "string" || body.parentId === null) data.parentId = body.parentId;

  const folder = await prisma.folder.update({ where: { id }, data });
  return NextResponse.json({ folder });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
