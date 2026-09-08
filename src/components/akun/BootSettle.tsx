"use client";
/* [boot-splash-v1] Dipasang di src/app/akun/layout.tsx SESUDAH {children}: efeknya
   jalan setelah efek halaman, jadi penahan (BootLoader/BootHold) yang terpasang di
   commit pertama sudah tercatat sebelum tirai diperiksa. */
import { useEffect } from "react";
import { markAppMounted } from "@/lib/bootSplash";

export default function BootSettle() {
  useEffect(() => { markAppMounted(); }, []);
  return null;
}
