// [life-dashboard-v1] Pintu masuk /life.
// Server component: cookie diperiksa di sini, jadi kalau PIN belum benar
// bundel dashboard-nya bahkan tidak pernah dikirim ke browser.
import { cookies } from "next/headers";
import { COOKIE_LIFE, tokenBenar, pakaiPinBawaan } from "./lib/pin";
import Gerbang from "./komponen/Gerbang";
import Dashboard from "./komponen/Dashboard";

export const dynamic = "force-dynamic";

export default async function HalamanLife() {
  const jar = await cookies();
  const masuk = tokenBenar(jar.get(COOKIE_LIFE)?.value);

  if (!masuk) return <Gerbang pinBawaan={pakaiPinBawaan()} />;
  return <Dashboard pinBawaan={pakaiPinBawaan()} />;
}
