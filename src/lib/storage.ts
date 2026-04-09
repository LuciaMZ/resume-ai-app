// =============================================================================
// LocalStorage Utilities
// =============================================================================
// Namespaced read/write utilities for browser localStorage.
// All keys are prefixed with "resumeAIapp:" to avoid collisions.
// =============================================================================

/** Namespaced storage keys used throughout the application */
export const STORAGE_KEYS = {
  /** JSON-serialized ResumeData */
  RESUME_DATA: 'resumeAIapp:resume',
  /** JSON-serialized AIConfig */
  AI_CONFIG: 'resumeAIapp:ai-config',
  /** JSON-serialized app settings / UI preferences */
  APP_SETTINGS: 'resumeAIapp:settings',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type StorageErrorOperation = 'parse' | 'write' | 'remove';

export interface StorageErrorInfo {
  key: string;
  operation: StorageErrorOperation;
  error?: unknown;
}

type StorageErrorListener = (info: StorageErrorInfo) => void;

const storageErrorListeners = new Set<StorageErrorListener>();
const queuedStorageErrors: StorageErrorInfo[] = [];

function notifyStorageError(info: StorageErrorInfo): void {
  if (storageErrorListeners.size === 0) {
    queuedStorageErrors.push(info);
    return;
  }

  storageErrorListeners.forEach((listener) => {
    listener(info);
  });
}

export function subscribeToStorageErrors(
  listener: StorageErrorListener
): () => void {
  storageErrorListeners.add(listener);

  if (queuedStorageErrors.length > 0) {
    const queued = [...queuedStorageErrors];
    queuedStorageErrors.length = 0;
    queued.forEach((info) => listener(info));
  }

  return () => {
    storageErrorListeners.delete(listener);
  };
}

/**
 * Read and parse a JSON value from localStorage.
 * Returns `null` if the key doesn't exist or parsing fails.
 */
export function getStorageItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[storage] Failed to parse key "${key}"`);
    notifyStorageError({ key, operation: 'parse' });
    return null;
  }
}

/**
 * Serialize a value to JSON and write it to localStorage.
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return true;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[storage] Failed to write key "${key}"`, error);
    notifyStorageError({ key, operation: 'write', error });
    return false;
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return true;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[storage] Failed to remove key "${key}"`, error);
    notifyStorageError({ key, operation: 'remove', error });
    return false;
  }
}
