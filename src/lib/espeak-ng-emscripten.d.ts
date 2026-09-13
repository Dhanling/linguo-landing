/* [tts-latin-espeak-v1] Paket Emscripten ini tak membawa deklarasi tipe.
   Cuma bagian yang dipakai src/lib/ttsEspeak.ts. */
declare module "@echogarden/espeak-ng-emscripten" {
  const Module: () => Promise<{ eSpeakNGWorker: new () => unknown }>;
  export default Module;
}
