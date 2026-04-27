// ════════════════════════════════════════════════════════════════
// NicheMultiSelect — chips for niches with custom add
// ════════════════════════════════════════════════════════════════
// Place at: src/components/lingtership/NicheMultiSelect.tsx
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { NICHE_OPTIONS, formatNicheLabel } from "./lingtership-helpers";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function NicheMultiSelect({ value, onChange }: Props) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const addCustom = () => {
    const cleaned = customInput.trim().toLowerCase().replace(/\s+/g, "_");
    if (!cleaned) return;
    if (!value.includes(cleaned)) {
      onChange([...value, cleaned]);
    }
    setCustomInput("");
    setShowCustom(false);
  };

  const removeNiche = (id: string) => {
    onChange(value.filter(v => v !== id));
  };

  // Predefined niche IDs untuk identify yang custom
  const predefinedIds = new Set(NICHE_OPTIONS.map(n => n.id));
  const customNiches = value.filter(v => !predefinedIds.has(v));

  return (
    <div className="space-y-2">
      {/* Selected (including custom) — show as removable chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(v => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
            >
              {formatNicheLabel(v)}
              <button
                type="button"
                onClick={() => removeNiche(v)}
                className="hover:text-teal-900 dark:hover:text-teal-200"
                aria-label={`Hapus ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Predefined options */}
      <div className="flex flex-wrap gap-1.5">
        {NICHE_OPTIONS.map(n => {
          const active = value.includes(n.id);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => toggle(n.id)}
              className={`
                px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors
                ${active
                  ? "bg-teal-500 text-white border-teal-500 hover:bg-teal-600"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                }
              `}
            >
              {n.label}
            </button>
          );
        })}

        {/* Add custom button */}
        {!showCustom && (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-dashed text-muted-foreground hover:text-foreground hover:border-foreground/40"
          >
            <Plus className="h-3 w-3" /> Custom
          </button>
        )}
      </div>

      {/* Custom input */}
      {showCustom && (
        <div className="flex gap-2">
          <Input
            placeholder="e.g. parenting, fashion..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              } else if (e.key === "Escape") {
                setShowCustom(false);
                setCustomInput("");
              }
            }}
            className="h-8 text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="px-3 h-8 text-xs font-medium rounded bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowCustom(false); setCustomInput(""); }}
            className="px-3 h-8 text-xs rounded border hover:bg-muted"
          >
            Batal
          </button>
        </div>
      )}

      {customNiches.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          💡 Custom: {customNiches.map(formatNicheLabel).join(", ")}
        </p>
      )}
    </div>
  );
}
