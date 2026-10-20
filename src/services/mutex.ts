/**
 * ============================================================================
 * CONCURRENCY LOCK & TRANSACTION MANAGER (Mutex)
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * 1. PostgreSQL: `SELECT ... FROM ticket_tiers WHERE id = :id FOR UPDATE`
 *    Acquires an exclusive row-level lock on the row, preventing concurrent
 *    transactions from reading or modifying the inventory balance until COMMIT.
 * 2. Distributed Redis Lock (Redlock / SET NX PX):
 *    In microservice architectures, an atomic key acquisition like
 *    `SET lock:tier:123 token NX PX 5000` guarantees only a single pod/thread
 *    evaluates capacity and decrements the hold pool at any millisecond.
 * ============================================================================
 */

type ReleaseFn = () => void;

interface LockQueueItem {
  resolve: (release: ReleaseFn) => void;
  reject: (reason?: unknown) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

class KeyedMutex {
  private activeLocks = new Set<string>();
  private queues = new Map<string, LockQueueItem[]>();

  /**
   * Acquires an exclusive lock for the given resource key.
   * If the lock is already held, queues the request until released or timed out.
   */
  async acquire(key: string, timeoutMs: number = 8000): Promise<ReleaseFn> {
    return new Promise<ReleaseFn>((resolve, reject) => {
      // If no active lock, acquire immediately
      if (!this.activeLocks.has(key)) {
        this.activeLocks.add(key);
        resolve(this.createReleaseFn(key));
        return;
      }

      // Lock is held; queue this operation
      const queue = this.queues.get(key) || [];
      const queueItem: LockQueueItem = {
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          // Remove from queue on timeout
          const currentQueue = this.queues.get(key) || [];
          this.queues.set(key, currentQueue.filter(item => item !== queueItem));
          reject(new Error(`[Mutex] Lock acquisition timed out for resource: ${key}`));
        }, timeoutMs)
      };

      queue.push(queueItem);
      this.queues.set(key, queue);
    });
  }

  private createReleaseFn(key: string): ReleaseFn {
    let released = false;
    return () => {
      if (released) return;
      released = true;

      const queue = this.queues.get(key) || [];
      const next = queue.shift();

      if (next) {
        clearTimeout(next.timeoutId);
        // Hand off lock directly to the next queued caller without freeing activeLocks
        next.resolve(this.createReleaseFn(key));
      } else {
        // No more callers waiting on this key
        this.activeLocks.delete(key);
        this.queues.delete(key);
      }
    };
  }

  /**
   * Check if a specific resource is currently locked
   */
  isLocked(key: string): boolean {
    return this.activeLocks.has(key);
  }

  /**
   * Inspect current locked keys (for diagnostic and dev panel)
   */
  getActiveLocks(): string[] {
    return Array.from(this.activeLocks);
  }
}

export const mutex = new KeyedMutex();

/**
 * Runs a transactional block under an exclusive lock for the designated key.
 * Mimics SQL `BEGIN; SELECT ... FOR UPDATE; ... COMMIT;`
 */
export async function runTransaction<T>(
  lockKey: string,
  operation: () => Promise<T>,
  timeoutMs = 8000
): Promise<T> {
  const release = await mutex.acquire(lockKey, timeoutMs);
  try {
    return await operation();
  } finally {
    release();
  }
}
