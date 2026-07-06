import { prisma } from "@/lib/db";
import { AssetBrowser } from "@/components/assets/asset-browser";

export default async function AssetsPage() {
  const [assets, folders] = await Promise.all([
    prisma.asset.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.folder.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Assets</h1>
        <p className="text-sm text-muted-foreground">
          Every generated character, location, prop, video, and audio clip lives here, versioned and searchable.
        </p>
      </div>
      <AssetBrowser initialAssets={assets} initialFolders={folders} />
    </div>
  );
}
