import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer available globally
(window as any).Buffer = Buffer;

// Make process available globally
(window as any).process = process;

// Ensure global is available
if (typeof global === 'undefined') {
  (window as any).global = window;
}
