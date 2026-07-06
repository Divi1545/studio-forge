"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { assetTypeIcon, assetTypeLabel } from "@/lib/asset-display";
import type { Asset, Scene } from "@/generated/prisma/client";

export interface AssetDetail extends Asset {
  parentAsset: Asset | null;
  childVersions: Asset[];
  sceneAssets: { scene: Scene }[];
}

interface AssetDetailSheetProps {
  asset: AssetDetail | null;
  onClose: () => void;
}

export function AssetDetailSheet({ asset, onClose }: AssetDetailSheetProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!asset) return null;
  const Icon = assetTypeIcon[asset.type];

  async function toggleFavorite() {
    if (!asset) return;
    setBusy(true);
    try {
      await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !asset.favorite }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      router.refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(asset)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <SheetTitle>{asset.name}</SheetTitle>
          </div>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant="secondary">{assetTypeLabel[asset.type]}</Badge>
            <span>v{asset.version}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 px-4">
          <Button size="sm" variant="outline" disabled={busy} onClick={toggleFavorite}>
            <Star className={cn("h-4 w-4", asset.favorite && "fill-primary text-primary")} />
            {asset.favorite ? "Favorited" : "Favorite"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <Tabs defaultValue="overview" className="px-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="scenes">Scenes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-3 text-sm">
            {asset.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.thumbnailUrl}
                alt={asset.name}
                className="w-full rounded-md border border-border object-cover"
              />
            ) : null}
            <Field label="Prompt" value={asset.prompt} />
            <Field label="Negative prompt" value={asset.negativePrompt} />
            <Field label="Notes" value={asset.notes} />
            <Field label="Provider" value={asset.provider} />
            <Field label="Model" value={asset.modelUsed} />
            {asset.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="metadata" className="text-sm">
            {asset.metadata ? (
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {JSON.stringify(asset.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No metadata recorded.</p>
            )}
          </TabsContent>

          <TabsContent value="versions" className="flex flex-col gap-2 text-sm">
            {asset.parentAsset ? (
              <p className="text-muted-foreground">
                Parent: <span className="text-foreground">{asset.parentAsset.name}</span> (v
                {asset.parentAsset.version})
              </p>
            ) : null}
            {asset.childVersions.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {asset.childVersions.map((child) => (
                  <li key={child.id} className="text-muted-foreground">
                    v{child.version} &mdash; <span className="text-foreground">{child.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No other versions yet.</p>
            )}
          </TabsContent>

          <TabsContent value="scenes" className="flex flex-col gap-2 text-sm">
            {asset.sceneAssets.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {asset.sceneAssets.map(({ scene }) => (
                  <li key={scene.id} className="text-muted-foreground">
                    <span className="text-foreground">{scene.title}</span> &mdash; {scene.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Not used in any scene yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}
