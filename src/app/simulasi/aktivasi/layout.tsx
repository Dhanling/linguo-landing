// [simulasi-aktivasi-wa-v1] Halaman pribadi per tagihan — jangan diindeks.
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aktivasi Prediction Test — Linguo.id",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
