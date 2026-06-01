"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

type Props = {
  avatarUrl?: string;
  firstName?: string;
  studentId?: string;
  supabase: any;
  onUploaded: (url: string) => void;
};

export default function AvatarUploader({ avatarUrl, firstName, studentId, supabase, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function uploadFile(file: File) {
    if (!file || !studentId) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${studentId}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from("student-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("student-avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("students").update({ avatar_url: url }).eq("id", studentId);
      onUploaded(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Upload gagal. Coba lagi atau pakai file lain.");
    } finally {
      setUploading(false);
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) uploadFile(f);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // 1) File langsung di-drop
    const file = e.dataTransfer.files?.[0];
    if (file) { uploadFile(file); return; }
    // 2) Gambar di-drag dari tab/window lain (URL) — best effort, bisa kena CORS
    const uri =
      e.dataTransfer.getData("text/uri-list") ||
      e.dataTransfer.getData("text/plain");
    const match = uri && uri.match(/https?:\/\/[^\s"']+/);
    if (match) {
      setUploading(true);
      try {
        const res = await fetch(match[0]);
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) throw new Error("bukan gambar");
        const ext = (blob.type.split("/").pop() || "jpg").replace("jpeg", "jpg");
        await uploadFile(new File([blob], `drop.${ext}`, { type: blob.type }));
      } catch (err) {
        console.error("Drop URL upload failed:", err);
        alert("Gambar dari tab lain ga bisa diambil (kemungkinan diblokir situsnya). Coba simpan dulu lalu drag filenya.");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      title="Klik atau drag gambar untuk ganti foto"
      className={`group relative h-28 w-28 cursor-pointer overflow-hidden rounded-3xl shadow-lg ring-4 transition ${
        dragOver ? "ring-[#16796E]" : "ring-white"
      }`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#16796E]/10 text-4xl font-extrabold text-[#16796E]">
          {firstName?.[0]?.toUpperCase() || "S"}
        </div>
      )}

      {/* Overlay: muncul saat hover atau dragOver */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-white transition-opacity ${
          dragOver || uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Camera className="h-5 w-5" strokeWidth={2.2} />
            <span className="px-2 text-center text-[10px] font-bold leading-tight">
              {dragOver ? "Lepas di sini" : "Ganti Foto"}
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
