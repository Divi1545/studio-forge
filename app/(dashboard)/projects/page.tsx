import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { prisma } from "@/lib/db";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { assets: true, scenes: true } } },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Characters, locations, scripts, and timelines, grouped per production.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No projects yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{project.name}</span>
              </div>
              {project.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
              ) : null}
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>{project._count.assets} assets</span>
                <span>{project._count.scenes} scenes</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
