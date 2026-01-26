import { defineConfig, build as viteBuild } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';

// Helper to copy directory recursively
function copyDir(src: string, dest: string): void {
  if (!existsSync(src)) return;
  
  mkdirSync(dest, { recursive: true });
  
  for (const entry of readdirSync(src)) {
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Shared config
const sharedConfig = {
  resolve: {
    alias: {
      '@': resolve(__dirname, 'extension/src'),
    },
  },
  target: 'esnext' as const,
  minify: 'esbuild' as const,
  sourcemap: false,
};

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'popup/popup': resolve(__dirname, 'extension/src/popup/popup.ts'),
      },
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    ...sharedConfig,
  },
  resolve: sharedConfig.resolve,
  publicDir: 'extension/public',
  plugins: [
    {
      name: 'build-content-script',
      async closeBundle() {
        // Build content script as IIFE in a separate pass
        await viteBuild({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            rollupOptions: {
              input: {
                'content/index': resolve(__dirname, 'extension/src/content/index.ts'),
              },
              output: {
                format: 'iife',
                entryFileNames: '[name].js',
              },
            },
            ...sharedConfig,
          },
          resolve: sharedConfig.resolve,
          publicDir: false,
        });
        
        console.log('Built content script as IIFE');
      },
    },
    {
      name: 'copy-manifest-and-assets',
      closeBundle() {
        // Copy manifest.json
        copyFileSync(
          resolve(__dirname, 'extension/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );
        
        // Copy popup HTML
        mkdirSync(resolve(__dirname, 'dist/popup'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'extension/src/popup/popup.html'),
          resolve(__dirname, 'dist/popup/popup.html')
        );
        
        // Copy assets (fonts and icons)
        copyDir(
          resolve(__dirname, 'extension/assets'),
          resolve(__dirname, 'dist/assets')
        );
        
        console.log('Copied manifest.json, popup HTML, and assets');
      },
    },
  ],
});
