/// <reference types="vitest" />

import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(({ mode }) => {
  return {
    plugins: [angular()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'cypress',
        'src/**/*.e2e-spec.ts'
      ],
      
      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'node_modules/',
          'src/test-setup.ts',
          'src/**/*.d.ts',
          'src/**/*.config.ts',
          'src/**/*.spec.ts',
          'src/**/*.test.ts',
          'src/main.ts',
          '**/*.interface.ts',
          '**/*.type.ts',
          '**/*.enum.ts',
          '**/*.constant.ts'
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        }
      },
      
      // Test timeout
      testTimeout: 10000,
      hookTimeout: 10000,
      
      // Mock configuration
      deps: {
        inline: [
          '@angular',
          '@angular/common',
          '@angular/core',
          '@angular/platform-browser',
          '@angular/platform-browser-dynamic',
          '@angular/router',
          '@angular/material'
        ]
      },
      
      // Reporter configuration
      reporter: ['verbose', 'json', 'html'],
      outputFile: {
        json: './test-results/vitest-results.json',
        html: './test-results/vitest-results.html'
      },
      
      // File watching
      watch: false,
      
      // Parallel execution
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false
        }
      }
    },
    
    define: {
      'import.meta.vitest': mode !== 'production',
    },
    
    resolve: {
      alias: {
        '@app': new URL('./src/app', import.meta.url).pathname,
        '@shared': new URL('./src/app/shared', import.meta.url).pathname,
        '@core': new URL('./src/app/core', import.meta.url).pathname,
        '@features': new URL('./src/app/features', import.meta.url).pathname,
        '@environments': new URL('./src/environments', import.meta.url).pathname,
        '@assets': new URL('./src/assets', import.meta.url).pathname
      }
    },
    
    // Build optimizations for testing
    esbuild: {
      target: 'node14'
    }
  };
});