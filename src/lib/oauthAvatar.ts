// [avatar-google-huruf-v1] Akun Google yang TIDAK punya foto tetap mengirim `picture`:
// gambar huruf awal di lingkaran berwarna (PNG ±1 KB). URL-nya tidak bisa dibedakan dari
// foto asli (sama-sama lh3.googleusercontent.com/a/ACg8oc…), jadi dulu ikut tersimpan ke
// students.avatar_url dan mengalahkan avatar ilustrasi bawaan di semua dashboard.
// Bedanya baru kelihatan dari isinya: gambar huruf = PNG kecil, foto asli = JPEG.
// Dipakai di browser (/akun) maupun server (/api/enroll).

const HURUF_MAKS_BYTE = 3000;

/** URL foto OAuth kalau memang foto; null kalau cuma gambar huruf bawaan Google. */
export async function fotoOauthAsli(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (!/^https:\/\/lh\d\.googleusercontent\.com\//.test(url)) return url;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return url;
    const jenis = res.headers.get("content-type") || "";
    const ukuran = (await res.arrayBuffer()).byteLength;
    return jenis.startsWith("image/png") && ukuran < HURUF_MAKS_BYTE ? null : url;
  } catch {
    return url; // gagal memeriksa → perilaku lama, jangan sampai foto asli hilang
  }
}
