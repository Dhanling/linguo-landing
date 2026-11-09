// [audit9-ilike-escape-v1] `%` dan `_` (dan `\`) adalah wildcard/escape bagi
// ILIKE di Postgres. Email login seperti "rina_putri@x.com" tanpa escape ikut
// cocok dengan "rina.putri@x.com" milik orang lain — kepemilikan rekaman/pembelian
// bisa nyasar. Pakai ini untuk SETIAP pencocokan email lewat ilike.
export function amanIlike(s: string): string {
  return String(s ?? "").replace(/([\\%_])/g, "\\$1");
}
