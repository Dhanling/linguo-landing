// ════════════════════════════════════════════════════════════════
// ProspectFormModal — Add/Edit KOL prospect (Sprint 3)
// ════════════════════════════════════════════════════════════════
// Place at: src/components/lingtership/ProspectFormModal.tsx
//
// Sprint 3 changes:
//   #1 — "+ Tambah Magang" inline button (opens QuickAddInternDialog)
//   #2 — Niche: free text → multi-select chips with custom option
//   #3 — Profile URL: shown PER platform (after platforms picked),
//                     auto-build from handle, auto-extract handle from URL
//   #4 — Platform: single-select → multi-select chips
//   #5 — Approach tracking: approach_date, planned_dm_date,
//                           last_followup_date, approach_method
// Plus: audience_size_tier (replaces raw followers count)
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/supabase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/src/components/ui/select";
import { Plus, UserPlus, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  PlatformId,
  PLATFORM_OPTIONS,
  PLATFORM_LABEL,
  AUDIENCE_TIER_OPTIONS,
  APPROACH_METHOD_OPTIONS,
  extractHandleFromUrl,
  buildProfileUrl,
  isValidUrl,
} from "./lingtership-helpers";
import { PlatformMultiSelect } from "./PlatformMultiSelect";
import { NicheMultiSelect } from "./NicheMultiSelect";
import { QuickAddInternDialog } from "./QuickAddInternDialog";

interface Props {
  prospect: any;
  interns: any[];
  onClose: () => void;
}

export function ProspectFormModal({ prospect, interns, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!prospect;

  const activeInterns = interns.filter((i: any) => i.status === "active");

  // ─── Form state ────────────────────────────────────────────────
  const [form, setForm] = useState({
    kol_handle: prospect?.kol_handle || "",
    kol_name: prospect?.kol_name || "",
    handle: prospect?.handle || "",
    platforms: (prospect?.platforms || []) as PlatformId[],
    profile_urls: (prospect?.profile_urls || {}) as Record<string, string>,
    niches: (prospect?.niches || []) as string[],
    audience_size_tier: prospect?.audience_size_tier || "",
    intern_id: prospect?.intern_id || (activeInterns[0]?.id || ""),
    approach_date: prospect?.approach_date || "",
    planned_dm_date: prospect?.planned_dm_date || "",
    last_followup_date: prospect?.last_followup_date || "",
    approach_method: prospect?.approach_method || "",
    reason_to_target: prospect?.reason_to_target || "",
    notes: prospect?.notes || "",
  });

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const [showAddIntern, setShowAddIntern] = useState(false);
  const [showApproachSection, setShowApproachSection] = useState(
    !!(prospect?.approach_date || prospect?.planned_dm_date || prospect?.last_followup_date || prospect?.approach_method)
  );

  // ─── Auto-extract handle when handle field is empty and kol_handle has URL-like content ──
  useEffect(() => {
    if (!form.handle && form.kol_handle) {
      const extracted = extractHandleFromUrl(form.kol_handle);
      if (extracted) {
        setForm(f => ({ ...f, handle: extracted }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // ─── URL helpers ───────────────────────────────────────────────
  const setProfileUrl = (platform: string, url: string) => {
    setForm(f => ({
      ...f,
      profile_urls: { ...f.profile_urls, [platform]: url },
    }));
    // If user pastes a full URL and handle is still empty, auto-extract
    if (url && !form.handle) {
      const extracted = extractHandleFromUrl(url);
      if (extracted) {
        setForm(f => ({ ...f, handle: extracted }));
      }
    }
  };

  // Auto-build URL from handle when platform is added
  const handlePlatformsChange = (next: PlatformId[]) => {
    const newProfileUrls = { ...form.profile_urls };
    // For each newly-added platform, prefill URL from handle (if handle exists)
    next.forEach(p => {
      if (!newProfileUrls[p] && form.handle) {
        newProfileUrls[p] = buildProfileUrl(form.handle, p);
      }
    });
    // Remove URL entries for platforms that were unchecked
    Object.keys(newProfileUrls).forEach(p => {
      if (!next.includes(p as PlatformId)) {
        delete newProfileUrls[p];
      }
    });
    setForm(f => ({ ...f, platforms: next, profile_urls: newProfileUrls }));
  };

  // ─── Save mutation ─────────────────────────────────────────────
  const save = useMutation({
    mutationFn: async () => {
      if (!form.kol_handle.trim()) throw new Error("KOL handle wajib diisi");
      if (!form.intern_id) throw new Error("Pilih magang yang prospect");
      if (form.platforms.length === 0) throw new Error("Pilih minimal 1 platform");

      // Validate all URLs
      for (const [platform, url] of Object.entries(form.profile_urls)) {
        if (url && !isValidUrl(url)) {
          throw new Error(`Profile URL untuk ${PLATFORM_LABEL[platform] || platform} tidak valid`);
        }
      }

      // Strip empty URL entries
      const cleanProfileUrls: Record<string, string> = {};
      Object.entries(form.profile_urls).forEach(([k, v]) => {
        if (v && v.trim()) cleanProfileUrls[k] = v.trim();
      });

      const payload = {
        kol_handle: form.kol_handle.trim(),
        kol_name: form.kol_name.trim() || null,
        handle: form.handle.trim() || null,
        platforms: form.platforms,
        profile_urls: cleanProfileUrls,
        niches: form.niches,
        audience_size_tier: form.audience_size_tier || null,
        intern_id: form.intern_id,
        approach_date: form.approach_date || null,
        planned_dm_date: form.planned_dm_date || null,
        last_followup_date: form.last_followup_date || null,
        approach_method: form.approach_method || null,
        reason_to_target: form.reason_to_target.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("kol_prospects")
          .update(payload)
          .eq("id", prospect.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kol_prospects").insert(payload);
        if (error) {
          if (error.code === "23505") {
            throw new Error(`KOL "${form.kol_handle}" sudah pernah di-prospect sebelumnya`);
          }
          throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kol-prospects"] });
      toast.success(isEdit ? "Prospect updated" : "Prospect ditambahkan!");
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Gagal menyimpan"),
  });

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isEdit ? "Edit Prospect KOL" : "Tambah Prospect KOL Baru"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* No-interns warning ─── Issue #1 fix: inline add button */}
            {activeInterns.length === 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    Belum ada magang aktif. Tambah dulu sebelum prospect KOL.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs mt-2"
                    onClick={() => setShowAddIntern(true)}
                  >
                    <UserPlus className="h-3 w-3 mr-1" /> Tambah Magang Sekarang
                  </Button>
                </div>
              </div>
            )}

            {/* ─── KOL Identity ─── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground">KOL Handle *</label>
                <Input
                  placeholder="@bahasakini"
                  value={form.kol_handle}
                  onChange={e => setF("kol_handle", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Nama (opsional)</label>
                <Input
                  placeholder="Bahasa Kini"
                  value={form.kol_name}
                  onChange={e => setF("kol_name", e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* ─── Platforms (Issue #4) ─── */}
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1.5">
                Platform * <span className="text-muted-foreground/60">(boleh pilih lebih dari satu)</span>
              </label>
              <PlatformMultiSelect
                value={form.platforms}
                onChange={handlePlatformsChange}
              />
            </div>

            {/* ─── Audience Size Tier ─── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Audience Size</label>
                <Select
                  value={form.audience_size_tier || "__none"}
                  onValueChange={v => setF("audience_size_tier", v === "__none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pilih tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— Skip —</SelectItem>
                    {AUDIENCE_TIER_OPTIONS.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.emoji} {t.label} ({t.range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Handle (auto-extracted)</label>
                <Input
                  placeholder="@bahasakini"
                  value={form.handle}
                  onChange={e => setF("handle", e.target.value)}
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* ─── Profile URLs (Issue #3) ─── */}
            {form.platforms.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <label className="text-[10px] text-muted-foreground block">
                  Profile URLs <span className="text-muted-foreground/60">(auto-prefilled dari handle, bisa di-edit)</span>
                </label>
                {form.platforms.map(platformId => {
                  const platformDef = PLATFORM_OPTIONS.find(p => p.id === platformId);
                  if (!platformDef) return null;
                  return (
                    <div key={platformId} className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground w-20 shrink-0">
                        {platformDef.label}
                      </span>
                      <Input
                        placeholder={platformDef.urlPrefix + "..."}
                        value={form.profile_urls[platformId] || ""}
                        onChange={e => setProfileUrl(platformId, e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Niche (Issue #2) ─── */}
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1.5">
                Niche <span className="text-muted-foreground/60">(boleh pilih lebih dari satu)</span>
              </label>
              <NicheMultiSelect
                value={form.niches}
                onChange={(next) => setF("niches", next)}
              />
            </div>

            {/* ─── Magang yang Prospect (with inline + button) ─── */}
            <div>
              <label className="text-[10px] text-muted-foreground">Magang yang Prospect *</label>
              <div className="flex gap-2">
                <Select
                  value={form.intern_id || "__none"}
                  onValueChange={v => setF("intern_id", v === "__none" ? "" : v)}
                >
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="Pilih magang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeInterns.length === 0 ? (
                      <SelectItem value="__none" disabled>Belum ada magang aktif</SelectItem>
                    ) : (
                      activeInterns.map((i: any) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs shrink-0"
                  onClick={() => setShowAddIntern(true)}
                  title="Tambah magang baru"
                >
                  <Plus className="h-3 w-3 mr-1" /> Magang Baru
                </Button>
              </div>
            </div>

            {/* ─── Approach Tracking (Issue #5) ─── */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowApproachSection(s => !s)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Approach Tracking (opsional)</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {showApproachSection ? "Sembunyikan ▴" : "Tampilkan ▾"}
                </span>
              </button>
              {showApproachSection && (
                <div className="px-3 pb-3 pt-1 space-y-3 border-t">
                  <p className="text-[10px] text-muted-foreground">
                    Isi kalau magang udah interaksi sebelum DM, atau sedang plan DM batch.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Approach Date</label>
                      <Input
                        type="date"
                        value={form.approach_date}
                        onChange={e => setF("approach_date", e.target.value)}
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Tanggal mulai interaksi
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Approach Method</label>
                      <Select
                        value={form.approach_method || "__none"}
                        onValueChange={v => setF("approach_method", v === "__none" ? "" : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Pilih metode..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none">— Skip —</SelectItem>
                          {APPROACH_METHOD_OPTIONS.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Planned DM Date</label>
                      <Input
                        type="date"
                        value={form.planned_dm_date}
                        onChange={e => setF("planned_dm_date", e.target.value)}
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Rencana kapan mau DM
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Last Followup Date</label>
                      <Input
                        type="date"
                        value={form.last_followup_date}
                        onChange={e => setF("last_followup_date", e.target.value)}
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        Follow-up terakhir
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Pitch & Notes ─── */}
            <div>
              <label className="text-[10px] text-muted-foreground">
                Kenapa cocok untuk Linguo? (pitch dari magang)
              </label>
              <Textarea
                placeholder="Audience-nya sesuai target Linguo, sering review apps belajar..."
                value={form.reason_to_target}
                onChange={e => setF("reason_to_target", e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground">Notes (opsional)</label>
              <Textarea
                placeholder="Catatan tambahan..."
                value={form.notes}
                onChange={e => setF("notes", e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button size="sm" variant="outline" onClick={onClose}>Batal</Button>
              <Button
                size="sm"
                className="bg-teal-500 hover:bg-teal-600"
                disabled={
                  !form.kol_handle.trim() ||
                  !form.intern_id ||
                  form.platforms.length === 0 ||
                  save.isPending
                }
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Menyimpan..." : isEdit ? "Update" : "Tambah Prospect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested dialog for quick-add intern */}
      <QuickAddInternDialog
        open={showAddIntern}
        onClose={() => setShowAddIntern(false)}
        onCreated={(newId) => {
          // Auto-select the newly created intern
          setF("intern_id", newId);
        }}
      />
    </>
  );
}
