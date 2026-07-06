"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder as FolderIcon, FolderPlus, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { assetTypeIcon, assetTypeLabel } from "@/lib/asset-display";
import { AssetType } from "@/generated/prisma/enums";
import type { Asset, Folder } from "@/generated/prisma/client";
import { CreateAssetDialog } from "./create-asset-dialog";
import { AssetDetailSheet, type AssetDetail } from "./asset-detail-sheet";

interface AssetBrowserProps {
  initialAssets: Asset[];
  initialFolders?: Folder[];
  projectId?: string;
  lockType?: AssetType;
  showFolderTree?: boolean;
}

interface FolderNode extends Folder {
  children: FolderNode[];
}

function buildFolderTree(folders: Folder[]): FolderNode[] {
  const byId = new Map<string, FolderNode>(folders.map((f) => [f.id, { ...f, children: [] }]));
  const roots: FolderNode[] = [];
  for (const folder of byId.values()) {
    if (folder.parentId && byId.has(folder.parentId)) {
      byId.get(folder.parentId)!.children.push(folder);
    } else {
      roots.push(folder);
    }
  }
  return roots;
}

export function AssetBrowser({
  initialAssets,
  initialFolders = [],
  projectId,
  lockType,
  showFolderTree = true,
}: AssetBrowserProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "ALL">(lockType ?? "ALL");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | "ALL">("ALL");
  const [selectedAsset, setSelectedAsset] = useState<AssetDetail | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | "ALL" | null>(null);

  const folderTree = useMemo(() => buildFolderTree(initialFolders), [initialFolders]);

  const filteredAssets = useMemo(() => {
    return initialAssets.filter((asset) => {
      if (typeFilter !== "ALL" && asset.type !== typeFilter) return false;
      if (favoriteOnly && !asset.favorite) return false;
      if (selectedFolderId !== "ALL" && asset.folderId !== selectedFolderId) return false;
      if (query && !asset.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [initialAssets, typeFilter, favoriteOnly, selectedFolderId, query]);

  async function openAsset(id: string) {
    const res = await fetch(`/api/assets/${id}`);
    if (res.ok) {
      const { asset } = await res.json();
      setSelectedAsset(asset);
    }
  }

  async function moveAssetToFolder(assetId: string, folderId: string | null) {
    await fetch(`/api/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    router.refresh();
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName, projectId }),
    });
    setNewFolderName("");
    router.refresh();
  }

  function renderFolderNode(node: FolderNode, depth: number) {
    const active = selectedFolderId === node.id;
    return (
      <div key={node.id}>
        <button
          onClick={() => setSelectedFolderId(node.id)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverFolderId(node.id);
          }}
          onDragLeave={() => setDragOverFolderId((cur) => (cur === node.id ? null : cur))}
          onDrop={(e) => {
            e.preventDefault();
            const assetId = e.dataTransfer.getData("text/plain");
            if (assetId) void moveAssetToFolder(assetId, node.id);
            setDragOverFolderId(null);
          }}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={cn(
            "flex w-full items-center gap-2 rounded-md py-1.5 pr-3 text-left text-sm transition-colors",
            active
              ? "bg-accent text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
            dragOverFolderId === node.id && "ring-1 ring-primary",
          )}
        >
          <FolderIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {node.children.map((child) => renderFolderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-6">
      {showFolderTree ? (
        <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-border pr-4">
          <button
            onClick={() => setSelectedFolderId("ALL")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverFolderId("ALL");
            }}
            onDragLeave={() => setDragOverFolderId((cur) => (cur === "ALL" ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              const assetId = e.dataTransfer.getData("text/plain");
              if (assetId) void moveAssetToFolder(assetId, null);
              setDragOverFolderId(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium transition-colors",
              selectedFolderId === "ALL"
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              dragOverFolderId === "ALL" && "ring-1 ring-primary",
            )}
          >
            All Assets
          </button>
          {folderTree.map((node) => renderFolderNode(node, 0))}
          <div className="mt-2 flex items-center gap-1.5 px-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
            />
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={createFolder}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </aside>
      ) : null}

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-56 pl-8"
            />
          </div>
          {!lockType ? (
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AssetType | "ALL")}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All types</SelectItem>
                {Object.values(AssetType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {assetTypeLabel[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            size="sm"
            variant={favoriteOnly ? "default" : "outline"}
            onClick={() => setFavoriteOnly((v) => !v)}
          >
            <Star className={cn("h-4 w-4", favoriteOnly && "fill-current")} />
            Favorites
          </Button>
          <div className="ml-auto">
            <CreateAssetDialog
              projectId={projectId}
              folderId={selectedFolderId === "ALL" ? undefined : selectedFolderId}
              lockType={lockType}
            />
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No assets match these filters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredAssets.map((asset) => {
              const Icon = assetTypeIcon[asset.type];
              return (
                <button
                  key={asset.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", asset.id)}
                  onClick={() => openAsset(asset.id)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/50"
                >
                  <div className="flex aspect-square items-center justify-center bg-muted">
                    {asset.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-1 p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{asset.name}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {assetTypeLabel[asset.type]}
                      </Badge>
                    </div>
                    {asset.favorite ? (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AssetDetailSheet asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}
