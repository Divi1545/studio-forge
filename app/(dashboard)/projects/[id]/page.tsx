import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { AssetType } from "@/generated/prisma/enums";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetBrowser } from "@/components/assets/asset-browser";
import { ModuleStub } from "@/components/module-stub";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

const ASSET_TABS: { value: string; label: string; type: AssetType }[] = [
  { value: "characters", label: "Characters", type: AssetType.CHARACTER },
  { value: "locations", label: "Locations", type: AssetType.LOCATION },
  { value: "props", label: "Props", type: AssetType.PROP },
  { value: "creatures", label: "Creatures", type: AssetType.CREATURE },
  { value: "storyboards", label: "Storyboards", type: AssetType.STORYBOARD },
  { value: "scripts", label: "Scripts", type: AssetType.SCRIPT },
  { value: "audio", label: "Audio", type: AssetType.AUDIO },
  { value: "videos", label: "Videos", type: AssetType.VIDEO },
];

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const [project, assets, folders] = await Promise.all([
    prisma.project.findUnique({ where: { id } }),
    prisma.asset.findMany({ where: { projectId: id }, orderBy: { createdAt: "desc" } }),
    prisma.folder.findMany({ where: { projectId: id }, orderBy: { name: "asc" } }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
        {project.description ? (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <Tabs defaultValue="characters" className="flex flex-1 flex-col gap-4">
        <TabsList className="flex-wrap">
          {ASSET_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {ASSET_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="flex flex-1">
            <AssetBrowser
              initialAssets={assets}
              initialFolders={folders}
              projectId={project.id}
              lockType={tab.type}
              showFolderTree={false}
            />
          </TabsContent>
        ))}

        <TabsContent value="timeline" className="flex flex-1">
          <ModuleStub
            title="Timeline"
            phase={7}
            description="Cinema Studio's scene timeline, drag-to-reorder tracks, and render queue arrive in Phase 7."
          />
        </TabsContent>

        <TabsContent value="exports" className="flex flex-1">
          <ModuleStub
            title="Exports"
            phase={7}
            description="Final rendered timeline exports (1080p / 4K) land here once Cinema Studio ships."
          />
        </TabsContent>

        <TabsContent value="versions" className="flex flex-1">
          <ModuleStub
            title="Versions"
            phase={3}
            description="Character/location version chains (expression sheets, outfit changes, aging) become browsable here once the Image Studio ships."
          />
        </TabsContent>

        <TabsContent value="assets" className="flex flex-1">
          <AssetBrowser
            initialAssets={assets}
            initialFolders={folders}
            projectId={project.id}
            showFolderTree
          />
        </TabsContent>
      </Tabs>

      <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">
        &larr; Back to Projects
      </Link>
    </div>
  );
}
