import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  const folders = await prisma.folder.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ folders });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const folder = await prisma.folder.create({
    data: {
      name,
      parentId: typeof body.parentId === "string" ? body.parentId : null,
      projectId: typeof body.projectId === "string" ? body.projectId : null,
    },
  });
  return NextResponse.json({ folder }, { status: 201 });
}
