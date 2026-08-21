// [pustaka-popup-blocked-v1] Membuka halaman bayar Xendit dari dalam dashboard.
//
// Masalahnya: invoice Xendit baru lahir SESUDAH fetch ke edge function, jadi
// `window.open(invoice_url)` yang dipanggil di belakang `await` sudah kehilangan
// gestur klik penggunanya. Safari (dan iOS) menolaknya sebagai popup — tabnya
// jadi "Pop-up Window Blocked", toast "halaman pembayaran dibuka" tetap muncul,
// dan dari sisi siswa tombol Beli terbaca seolah rusak.
//
// Pola yang dipakai: tab kosong dibuka SEKARANG (masih di dalam gestur klik),
// isinya diarahkan setelah invoice-nya jadi. Kalau ternyata tetap terhalang
// (pemblokir popup ketat), jangan diam — pindahkan tab ini saja ke Xendit,
// karena mentok tanpa halaman bayar jauh lebih buruk daripada pindah halaman.
//
// Catatan: JANGAN pakai "noopener" waktu membuka tab penampung — dengan flag itu
// window.open mengembalikan null, jadi tabnya tak bisa diarahkan lagi.

export type TabPembayaran = {
  /** Arahkan tab penampung ke invoice. Balikannya: true = tab baru, false = tab ini. */
  arahkan: (url: string) => boolean;
  /** Checkout gagal — tutup tab penampung supaya tak menggantung kosong. */
  batal: () => void;
};

/** Panggil ini di baris PERTAMA handler klik, sebelum fetch apa pun. */
export function siapkanTabPembayaran(): TabPembayaran {
  const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;

  // Tab kosong bawaan browser tampak seperti halaman rusak; beri kabar singkat
  // selama invoice-nya dibuatkan.
  if (tab) {
    try {
      tab.document.write(
        '<!doctype html><meta charset="utf-8"><title>Menyiapkan pembayaran…</title>' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<body style="margin:0;display:flex;align-items:center;justify-content:center;' +
          'height:100vh;font:500 15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;' +
          'color:#12172B;background:#F8FAFC">' +
          "Menyiapkan halaman pembayaran…</body>",
      );
      tab.document.close();
    } catch {
      // Beda origin / dokumen terkunci — tak apa, tab tetap bisa diarahkan.
    }
  }

  return {
    arahkan(url: string) {
      if (tab && !tab.closed) {
        try {
          tab.location.replace(url);
          tab.focus?.();
          return true;
        } catch {
          // jatuh ke tab ini di bawah
        }
      }
      window.location.href = url;
      return false;
    },
    batal() {
      try {
        tab?.close();
      } catch {
        /* abaikan */
      }
    },
  };
}
