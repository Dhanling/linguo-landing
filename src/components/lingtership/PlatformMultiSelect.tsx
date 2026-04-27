// ════════════════════════════════════════════════════════════════
// PlatformMultiSelect — multi-select chips for KOL platforms
// ════════════════════════════════════════════════════════════════
// Place at: src/components/lingtership/PlatformMultiSelect.tsx
// ════════════════════════════════════════════════════════════════

import { Instagram, Music2, Youtube, Globe, Twitter, Facebook, Check } from "lucide-react";
import { PLATFORM_OPTIONS, PlatformId } from "./lingtership-helpers";

const ICONS: Record<string, any> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  twitter: Twitter,
  facebook: Facebook,
  other: Globe,
};

interface Props {
  value: PlatformId[];
  onChange: (next: PlatformId[]) => void;
}

export function PlatformMultiSelect({ value, onChange }: Props) {
  const toggle = (id: PlatformId) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PLATFORM_OPTIONS.map(p => {
        const Icon = ICONS[p.id] || Globe;
        const active = value.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
              border transition-colors
              ${active
                ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                : "bg-background text-foreground border-border hover:bg-muted"
              }
            `}
          >
            {active ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
