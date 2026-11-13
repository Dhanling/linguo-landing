# MCP Server Linguo

Asisten AI (Claude, ChatGPT, dan klien MCP lain) bisa memakai Linguo sebagai tool:
mencari bahasa & program, cek harga resmi, menyusun rencana belajar, dan mengirim
permintaan trial ke admin.

- **Endpoint:** `https://linguo.id/api/mcp`
- **Transport:** Streamable HTTP, mode stateless (POST JSON-RPC → respons JSON). `GET` = 405.
- **Auth:** tidak ada (versi pertama; tidak ada data pengguna yang dibaca).
- **Kode:** `src/app/api/mcp/route.ts` → registri tool `src/lib/advisor/tools.ts`
  (dipakai bersama Konsultan web `/konsultasi`).
- **Sumber angka:** `src/lib/trial-pricing.ts` + `src/lib/brand-facts.ts` — pricelist yang sama
  dengan route invoice. Estimasi durasi deterministik di `src/lib/advisor/plan.ts`.

## Tool

| Tool | Tulis? | Fungsi |
|---|---|---|
| `list_languages` | – | Semua bahasa + level CEFR + link halaman, silabus, placement test, daftar |
| `search_programs(language, level?, format?, max_budget_idr?)` | – | Program yang cocok + harga IDR per level |
| `get_program_details(program_id)` | – | Detail satu program, mis. `private:japanese`, `ielts-toefl` |
| `estimate_learning_plan(language, current_level, target_level, hours_per_week, goal?, format?)` | – | Sesi per level, estimasi minggu/bulan, padanan ujian, estimasi biaya |
| `get_placement_test_link(language)` | – | Link placement test gratis |
| `request_trial(name, whatsapp, language, preferred_schedule?, notes?)` | **ya** | Simpan lead ke `leads` (source `mcp`). Tanpa pembayaran. |

Tool baca diberi anotasi `readOnlyHint: true`. `request_trial`:
validasi nomor WA, rate limit 5/jam per IP, dedupe nomor WA 24 jam (kanal `web_advisor` + `mcp`).
Semua endpoint juga dibatasi 200 request / 10 menit per IP (`api_rate_limits`).

## Uji lokal

```bash
npm run dev                                   # http://localhost:3000
npx @modelcontextprotocol/inspector           # buka UI Inspector
# Transport: Streamable HTTP · URL: http://localhost:3000/api/mcp → Connect → Tools → List
```

Tanpa Inspector (curl):

```bash
curl -s localhost:3000/api/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'

curl -s localhost:3000/api/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
  "params":{"name":"estimate_learning_plan","arguments":{"language":"Jepang","current_level":"none","target_level":"A2","hours_per_week":3,"goal":"kerja di Jepang"}}}' \
  | jq '.result.structuredContent'
```

## Menambahkan sebagai connector

**Claude (claude.ai / Desktop):** Settings → Connectors → *Add custom connector* →
nama `Linguo`, URL `https://linguo.id/api/mcp` → Add. Aktifkan di chat lewat menu tool.

**ChatGPT:** Settings → Apps & Connectors → Advanced → aktifkan *Developer mode* →
*Create* connector → URL `https://linguo.id/api/mcp`, Authentication: *No authentication*.

## Checklist sebelum submit ke direktori connector / app

- [ ] Endpoint produksi hidup & cepat (cek `tools/list` dan tiap tool lewat Inspector di URL produksi)
- [ ] SQL `supabase/sql/001_advisor_sessions.sql` sudah dijalankan (metrik `advisor_events` terisi)
- [ ] Uji `request_trial` sekali dengan nomor internal → lead muncul di halaman Leads admin (source `mcp`), lalu arsipkan
- [ ] Deskripsi tool akurat, tidak menjanjikan hasil; `readOnlyHint` benar
- [ ] Halaman kebijakan privasi (`/privacy`) menyebut data yang dikumpulkan lewat asisten AI (nama + WA untuk trial)
- [ ] Ikon/logo & nama "Linguo.id", kontak dukungan `hello@linguo.id`
- [ ] Contoh prompt uji: "Saya mau kerja di Jepang, mulai dari nol, 3 jam/minggu — rencana dan biayanya?"
- [ ] Kalau direktori mensyaratkan OAuth: tambahkan di `route.ts` (lihat komentar di atas file)
