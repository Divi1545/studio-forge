"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssetType } from "@/generated/prisma/enums";
import { assetTypeLabel } from "@/lib/asset-display";

interface CreateAssetDialogProps {
  projectId?: string;
  folderId?: string | null;
  lockType?: AssetType;
}

export function CreateAssetDialog({ projectId, folderId, lockType }: CreateAssetDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>(lockType ?? AssetType.IMAGE);
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          prompt: prompt || undefined,
          notes: notes || undefined,
          projectId,
          folderId,
        }),
      });
      if (res.ok) {
        setOpen(false);
        setName("");
        setPrompt("");
        setNotes("");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New asset</DialogTitle>
          <DialogDescription>
            Generation pipelines land in later phases — this saves an asset record directly.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-name">Name</Label>
            <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          {!lockType ? (
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AssetType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {assetTypeLabel[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-prompt">Prompt</Label>
            <Textarea id="asset-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="asset-notes">Notes</Label>
            <Textarea id="asset-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
