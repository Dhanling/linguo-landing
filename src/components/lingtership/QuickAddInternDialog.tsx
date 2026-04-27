// ════════════════════════════════════════════════════════════════
// QuickAddInternDialog — minimal inline form to add a new intern
//   without leaving the prospect form (fixes Issue #1)
// ════════════════════════════════════════════════════════════════
// Place at: src/components/lingtership/QuickAddInternDialog.tsx
// ════════════════════════════════════════════════════════════════

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/supabase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called with new intern's id after successful create — so the parent can auto-select it */
  onCreated: (newInternId: string) => void;
}

export function QuickAddInternDialog({ open, onClose, onCreated }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [igHandle, setIgHandle] = useState("");

  const reset = () => { setName(""); setIgHandle(""); };

  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Nama wajib diisi");
      const { data, error } = await supabase
        .from("interns")
        .insert({
          name: name.trim(),
          ig_handle: igHandle.trim() || null,
          start_date: new Date().toISOString().slice(0, 10),
          status: "active",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["interns"] });
      toast.success(`Magang "${name}" ditambahkan`);
      reset();
      onCreated(data.id);
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Gagal menambah magang"),
  });

  const handleClose = () => {
    if (create.isPending) return;
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Tambah Magang Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Quick-add. Detail lengkap (kontak, universitas, dll) bisa diisi nanti di tab Magang.
          </p>

          <div>
            <label className="text-[10px] text-muted-foreground">Nama *</label>
            <Input
              placeholder="Sarah Putri"
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-9 text-sm"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter" && name.trim()) {
                  e.preventDefault();
                  create.mutate();
                }
              }}
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground">IG Handle (opsional)</label>
            <Input
              placeholder="@sarahputri"
              value={igHandle}
              onChange={e => setIgHandle(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button size="sm" variant="outline" onClick={handleClose} disabled={create.isPending}>
              Batal
            </Button>
            <Button
              size="sm"
              className="bg-teal-500 hover:bg-teal-600"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Menyimpan..." : "Tambah Magang"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
