// Alias `@/` (tsconfig paths) tak dikenal Vitest secara otomatis — tanpa ini modul
// lib yang mengimpor `@/data/...` gagal dimuat di test.
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.join(process.cwd(), 'src') } },
});
