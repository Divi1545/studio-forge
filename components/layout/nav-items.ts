import type { LucideIcon } from "lucide-react";
import {
  Compass,
  ImageIcon,
  Clapperboard,
  AudioWaveform,
  Sparkles,
  Film,
  Plug,
  Megaphone,
  Smartphone,
  PlaySquare,
  Library,
  Workflow,
  UserRound,
  LayoutGrid,
  FolderOpen,
  FolderKanban,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Image", href: "/image", icon: ImageIcon },
  { label: "Video", href: "/video", icon: Clapperboard },
  { label: "Audio", href: "/audio", icon: AudioWaveform },
  { label: "AI Director", href: "/director", icon: Sparkles },
  { label: "Cinema Studio", href: "/cinema", icon: Film },
  { label: "Plugins", href: "/plugins", icon: Plug },
  { label: "Marketing Studio", href: "/marketing", icon: Megaphone },
  { label: "Shorts Studio", href: "/shorts", icon: Smartphone },
  { label: "Explainer", href: "/explainer", icon: PlaySquare },
  { label: "Originals", href: "/originals", icon: Library },
  { label: "Canvas", href: "/canvas", icon: Workflow },
  { label: "AI Influencer", href: "/influencer", icon: UserRound },
  { label: "Apps", href: "/apps", icon: LayoutGrid },
  { label: "Assets", href: "/assets", icon: FolderOpen },
  { label: "Projects", href: "/projects", icon: FolderKanban },
];
