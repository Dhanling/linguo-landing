# Rapor brush per bahasa

Rapor pada sertifikat dan tombol Cetak di kelas memakai komponen `RaporPaper` yang sama. Tema negara dan budaya mengikuti `courseCertificateTheme`, termasuk ASL dan BISINDO. Teks, skor, komentar, rekomendasi, kehadiran dan tanda tangan tetap berasal dari data aplikasi. Komentar menyesuaikan ukuran huruf dengan ruang cetak.

Palet ilustrasi: teal `#1A9E9E` dan oranye `#F5A623`, dengan dasar krem. Tidak memakai karakter orang. Pratinjau ringan dimuat di layar; gambar resolusi penuh dimuat sebelum ekspor atau cetak.

## Aset dan prompt imagegen

Mode: built-in imagegen. Referensi: contoh rapor yang dilampirkan pengguna. Hasil final disimpan pada `public/images/reports/brush-v1/`. Seluruh 67 bahasa katalog mendapat latar imagegen khusus rapor. Daftar lengkap bahasa, jalur aset dan prompt terdapat pada `docs/rapor-brush-prompts.json`. Nama kelas lama di luar katalog tetap memakai ilustrasi sertifikat.

Spesifikasi prompt dan aset bersama:

- `paper.webp`: latar A4 landscape, kertas ivory, sapuan brush teal dan daun oranye di sudut kiri bawah, bagian atas kosong untuk teks dinamis, tanpa teks/logo/landmark.
- `finnish.webp`: Helsinki waterfront dan Helsinki Cathedral, foliage oranye, pantulan air teal, ilustrasi di bawah/kanan, ruang atas kosong, dry-brush watercolor dua tinta, tanpa teks/logo/karakter.
- `asl.webp`: landmark New York waterfront, Statue of Liberty dan Brooklyn Bridge di bawah/kanan; brush teal–oranye seperti referensi; bagian atas kosong; tanpa orang/tangan/teks/logo.
- `bisindo.webp`: landmark Jakarta, Monas, Kota Tua dan siluet Borobudur di bawah/kanan; brush teal–oranye seperti referensi; bagian atas kosong; tanpa orang/tangan/teks/logo.
- `score.webp`: satu lingkaran sapuan brush teal transparan, tepi tidak beraturan, pusat pucat untuk angka dinamis, tanpa angka/teks/objek.

ASL dan BISINDO juga memiliki salinan pada direktori sertifikat dan `preview-v1` agar pemetaan kedua dokumen konsisten. Aset baru memakai path versi untuk cache immutable.
