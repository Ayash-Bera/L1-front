import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'markdown-vendor': [
            'react-markdown',
            'remark-gfm',
            'rehype-raw',
            'marked',
            'github-markdown-css'
          ],
          'utility-vendor': [
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'date-fns',
            'zod'
          ],
          'd3-vendor': ['d3', 'd3-sankey'],
          'math-vendor': ['katex', 'react-katex', 'mermaid']
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  // Add support for importing markdown files as raw text
  assetsInclude: ['**/*.md'],
  optimizeDeps: {
    include: [
      'react-markdown',
      'remark-gfm',
      'rehype-raw',
      'marked',
      'github-markdown-css',
      'katex',
      'mermaid'
    ]
  },
  // Ensure the submodule files are included and set up path resolution
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Keep public directory for other assets
  publicDir: 'public'
});