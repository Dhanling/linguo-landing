/**
 * Nomor WA → format `mobile_number` customer Xendit ("+628…").
 *
 * [xendit-mobile-62-ganda-v1] Dulu tiap rute menulis `+62${wa_number}` untuk nomor tanpa "+",
 * sehingga nomor yang sudah diketik "628…" menjadi "+62628…" — invoice & pengingat WA otomatis
 * (edge fn lead-invoice-notify membaca nomor ini) terkirim ke nomor yang salah.
 */
export function xenditMobile(wa: unknown): string {
  const raw = String(wa ?? "").trim();
  const digit = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return `+${digit}`;
  if (digit.startsWith("62")) return `+62${digit.replace(/^(62|0)+/, "")}`;
  return `+62${digit.replace(/^0+/, "")}`;
}
