// Test setup for Angular + Vitest
// ============================================================================

import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

// Initialize Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Global test configuration
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    display: 'none',
    appearance: ['-webkit-appearance'],
    getPropertyValue: () => '',
  }),
});

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => ({
    enumerable: true,
    configurable: true,
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {}
  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '12345678-1234-1234-1234-123456789012',
    getRandomValues: (arr: any) => arr.map(() => Math.floor(Math.random() * 256))
  },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Mock File API
global.File = class MockFile {
  constructor(
    public parts: (string | Blob | ArrayBuffer | ArrayBufferView)[],
    public name: string,
    public options?: FilePropertyBag
  ) {}
  
  get size(): number {
    return 0;
  }
  
  get type(): string {
    return this.options?.type || '';
  }
  
  get lastModified(): number {
    return this.options?.lastModified || Date.now();
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  text(): Promise<string> {
    return Promise.resolve('');
  }
  
  stream(): ReadableStream {
    return new ReadableStream();
  }
  
  slice(): Blob {
    return new Blob();
  }
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({}),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// Mock HTMLCanvasElement.toDataURL
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('');

// Angular Material CDK Mocks
vi.mock('@angular/cdk/a11y', () => ({
  A11yModule: {},
  FocusMonitor: vi.fn().mockImplementation(() => ({
    monitor: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    stopMonitoring: vi.fn(),
    focusVia: vi.fn(),
  })),
  LiveAnnouncer: vi.fn().mockImplementation(() => ({
    announce: vi.fn().mockReturnValue(Promise.resolve()),
  })),
}));

vi.mock('@angular/cdk/platform', () => ({
  Platform: vi.fn().mockImplementation(() => ({
    isBrowser: true,
    isServer: false,
    ANDROID: false,
    IOS: false,
    WEBKIT: false,
    EDGE: false,
    TRIDENT: false,
    BLINK: false,
    SAFARI: false,
    FIREFOX: false,
  })),
}));

// Global test utilities
declare global {
  interface Window {
    setImmediate: (callback: () => void) => void;
  }
}

// Polyfill setImmediate for tests
if (!window.setImmediate) {
  window.setImmediate = (callback: () => void) => {
    return setTimeout(callback, 0);
  };
}

// Console override to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Suppress known Angular testing warnings
  if (
    args[0]?.includes?.('Navigation triggered outside Angular zone') ||
    args[0]?.includes?.('ExpressionChangedAfterItHasBeenCheckedError')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  // Suppress common testing warnings
  if (
    args[0]?.includes?.('Material') ||
    args[0]?.includes?.('CDK')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Performance marks for testing
if (!window.performance.mark) {
  window.performance.mark = vi.fn();
}

if (!window.performance.measure) {
  window.performance.measure = vi.fn();
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id);
});