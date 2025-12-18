import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,

    onConsoleLog(log, type) {
    if (type === 'stderr') return false; // This hides console.error from the report
    },
    
    // --- REPORTING CONFIGURATION START ---
    // 'default' prints to console, 'junit' creates XML, 'html' creates the UI report
    reporters: ['default', 'junit', 'html'], 
    outputFile: {
      junit: './reports/vitest-report.xml',
      html: './reports/html-report/index.html',
    },
    // --- REPORTING CONFIGURATION END ---

    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', 
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        'e2e/',
      ],
    },
  },
})