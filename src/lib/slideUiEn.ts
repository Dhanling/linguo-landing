// [slide-terjemah-en-v2] Label bawaan slide (badge jenis, tombol Cek jawaban, PR,
// tooltip arti kata, label visual) ikut English bila dek sudah diterjemahkan
// (`slide.ui === "en"`, dipasang terjemahkanDekEn). SlideCard menyediakan nilainya,
// jadi semua jalur render — penampil pengajar, potret Kelas Video, /akun siswa — ikut.
import { createContext, useContext } from "react";

export const SlideEnCtx = createContext(false);
export const useSlideEn = () => useContext(SlideEnCtx);

/** Label jenis slide dalam English. */
export const SLIDE_TYPE_LABEL_EN: Record<string, string> = {
  title: "Opening", points: "Key points", vocab: "Vocabulary", pattern: "Sentence pattern",
  dialog: "Dialogue", practice: "Practice", quiz: "Quiz", recap: "Summary",
};
