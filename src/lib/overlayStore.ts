// linguo-patch:overlay-store-v1
// Registry global jumlah overlay/modal full-screen yang lagi kebuka.
// Tujuan: tombol FAB WhatsApp (ChatWidget) disembunyiin selama ada modal aktif
// (Trial Wizard, FunnelModal, AuthModal, RegisterModal, dst) biar ga numpuk.
//
// Tiap modal cukup panggil useOverlayLock(open) — ga ngubah logic open/close
// yang udah ada. ChatWidget baca count-nya via useSyncExternalStore.

import { useEffect } from "react";

let count = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function openOverlay() {
  count += 1;
  emit();
}

export function closeOverlay() {
  count = Math.max(0, count - 1);
  emit();
}

export function getOverlayCount() {
  return count;
}

export function subscribeOverlay(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// Helper buat modal: daftarin overlay selama `active` true, lepas pas unmount/tutup.
export function useOverlayLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    openOverlay();
    return () => closeOverlay();
  }, [active]);
}
