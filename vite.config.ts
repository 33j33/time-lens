import { defineConfig } from 'vite';
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

// Determine which build to run based on environment variable
const buildTarget = process.env.BUILD_TARGET || 'all';

// Content script config (IIFE format - required for chrome.scripting.executeScript)
const contentConfig = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear - other builds write here too
    rollupOptions: {
      input: {
        'content/index': resolve(__dirname, 'extension/src/content/index.ts'),
      },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'extension/src'),
    },
  },
  publicDir: false, // Don't copy public dir for this build
});

// Popup config (ESM format)
const mainConfig = defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Clear dist for the first build
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
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'extension/src'),
    },
  },
  publicDir: 'extension/public',
  plugins: [
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

// Export the appropriate config based on BUILD_TARGET
export default buildTarget === 'content' ? contentConfig : mainConfig;
