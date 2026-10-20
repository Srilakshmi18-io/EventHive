/**
 * ============================================================================
 * IN-MEMORY CACHE LAYER WITH TTL & INVALIDATION
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * Redis / Memcached / Edge CDN (Cloudflare Workers, Fastly, Varnish).
 * In production systems, high-traffic read endpoints like event catalogues and
 * detail views are cached with short TTLs (30s) to absorb spike traffic.
 * Cache invalidation (or purge tags) triggers when an event's metadata changes,
 * or when tickets are held, released, or purchased.
 * ============================================================================
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  lastAction: 'HIT' | 'MISS' | 'INVALIDATED' | 'IDLE';
  lastKey: string;
  timestamp: number;
}

type CacheListener = (stats: CacheStats) => void;

class SystemCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 30 * 1000; // 30 seconds TTL
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    lastAction: 'IDLE',
    lastKey: '',
    timestamp: Date.now(),
  };
  private listeners: Set<CacheListener> = new Set();

  /**
   * Subscribe to cache stats changes for Dev/Admin panel badge
   */
  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    listener(this.stats);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.stats);
    }
  }

  /**
   * Retrieve item from cache if present and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
      this.stats = {
        ...this.stats,
        hits: this.stats.hits + 1,
        lastAction: 'HIT',
        lastKey: key,
        timestamp: now,
      };
      this.notify();
      return entry.data;
    }

    if (entry && entry.expiresAt <= now) {
      this.store.delete(key);
    }

    this.stats = {
      ...this.stats,
      misses: this.stats.misses + 1,
      lastAction: 'MISS',
      lastKey: key,
      timestamp: now,
    };
    this.notify();
    return null;
  }

  /**
   * Store item in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    const now = Date.now();
    this.store.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.store.delete(key);
    this.stats = {
      ...this.stats,
      lastAction: 'INVALIDATED',
      lastKey: key,
      timestamp: Date.now(),
    };
    this.notify();
  }

  /**
   * Invalidate all keys matching prefix
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    this.stats = {
      ...this.stats,
      lastAction: 'INVALIDATED',
      lastKey: `${prefix}*`,
      timestamp: Date.now(),
    };
    this.notify();
  }

  /**
   * Flush entire cache
   */
  clear(): void {
    this.store.clear();
    this.stats = {
      ...this.stats,
      lastAction: 'INVALIDATED',
      lastKey: 'ALL',
      timestamp: Date.now(),
    };
    this.notify();
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }
}

export const systemCache = new SystemCache();
