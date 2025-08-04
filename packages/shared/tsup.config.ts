import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable tsup DTS generation, use tsc instead
  clean: true,
  tsconfig: './tsconfig.build.json',
});