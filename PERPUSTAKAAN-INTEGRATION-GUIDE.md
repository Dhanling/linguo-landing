# 📖 Integration Guide — Perpustakaan Saya Tab

Component-nya udah di-create di:
`src/components/PerpustakaanSaya.tsx`

Tapi karena `/akun/page.tsx` lo udah complex, gue gak patch in-place. Lo perlu add 3 hal manual:

---

## 1. Import component

Di atas `src/app/akun/page.tsx`, tambahin:

```tsx
import PerpustakaanSaya from "@/components/PerpustakaanSaya";
```

---

## 2. Tambah state untuk active tab

Di komponen utama `/akun`, kalau belum ada state tab, tambahin:

```tsx
const [activeTab, setActiveTab] = useState<"kursus" | "perpustakaan">("kursus");
```

Kalau lo udah punya struktur tab (Kursus Saya), tinggal tambah opsi "Perpustakaan Saya" ke daftar tab-nya.

---

## 3. Render tab UI + content

Cari bagian dimana lo render "Kursus Saya" section, tambahin tab switcher di atasnya:

```tsx
{/* Tab switcher */}
<div className="flex gap-2 border-b border-gray-200 mb-6">
  <button
    onClick={() => setActiveTab("kursus")}
    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      activeTab === "kursus" 
        ? "border-teal-600 text-teal-600" 
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    Kursus Saya
  </button>
  <button
    onClick={() => setActiveTab("perpustakaan")}
    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      activeTab === "perpustakaan" 
        ? "border-teal-600 text-teal-600" 
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    📚 Perpustakaan Saya
  </button>
</div>

{/* Tab content */}
{activeTab === "kursus" && (
  <div>
    {/* ... your existing Kursus Saya content ... */}
  </div>
)}

{activeTab === "perpustakaan" && user?.email && (
  <PerpustakaanSaya userEmail={user.email} supabase={supabase} />
)}
```

---

## 4. Ganti `user?.email` & `supabase` sesuai variable existing

Di code lo, kemungkinan user object & supabase client udah ada dengan nama lain. Sesuaikan:

| Di guide | Ganti dengan apa yang lo pake di /akun |
|---|---|
| `user?.email` | bisa jadi `student?.email`, `session?.user?.email`, dll |
| `supabase` | nama supabase client lo (dari import) |

---

## 5. Test

1. `npm run dev`
2. Login ke localhost:3000/akun pake akun yang udah pernah beli produk digital
3. Klik tab "Perpustakaan Saya"
4. Harusnya muncul list purchase yang status-nya "Lunas"

---

## ⚠️ Edge cases yang perlu lo test

- Akun belum pernah beli apa-apa → empty state "Perpustakaan Masih Kosong" muncul
- Beli e-book → tombol "📥 Download" muncul, klik → file ke-download
- Beli e-learning → tombol "▶️ Tonton" muncul, klik → buka YouTube playlist
- Akses expired → tombol "Perpanjang" muncul (bukan Download/Tonton)
- Akses lifetime (ebook) → label "⭐ Lifetime" muncul
