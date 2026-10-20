/**
 * ============================================================================
 * BACKGROUND WORKER / EXPIRY CRON
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * BullMQ / Celery / AWS SQS Delay Queues / Temporal Workflows.
 * In a real ticketing infrastructure (Ticketmaster, Eventbrite), holding tickets
 * creates a delayed job (e.g. BullMQ repeatable job or Redis keyspace notification)
 * scheduled for `expiresAt`. If checkout is not completed, a background worker
 * executes an atomic SQL UPDATE `UPDATE reservations SET status = 'EXPIRED' WHERE
 * status = 'ACTIVE' AND expires_at < NOW()`, freeing inventory and broadcasting
 * a cache purge.
 * ============================================================================
 */

import { db } from './db';
import { systemCache } from './cache';
import { runTransaction } from './mutex';

export interface WorkerStatus {
  isRunning: boolean;
  intervalMs: number;
  lastRunAt: string | null;
  lastExpiredCount: number;
  totalExpiredCount: number;
  demoMode: boolean;
  holdDurationSeconds: number;
}

type WorkerListener = (status: WorkerStatus) => void;

class ReservationExpiryWorker {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private isProcessing = false;
  private totalExpired = 0;
  private lastExpiredCount = 0;
  private lastRunAt: string | null = null;
  private listeners: Set<WorkerListener> = new Set();

  constructor() {
    // Automatically start worker on load
    this.start();
  }

  subscribe(listener: WorkerListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const status = this.getStatus();
    for (const l of this.listeners) {
      l(status);
    }
  }

  getStatus(): WorkerStatus {
    const config = db.getConfig();
    return {
      isRunning: this.timerId !== null,
      intervalMs: config.workerIntervalMs,
      lastRunAt: this.lastRunAt,
      lastExpiredCount: this.lastExpiredCount,
      totalExpiredCount: this.totalExpired,
      demoMode: config.demoMode,
      holdDurationSeconds: config.holdDurationSeconds,
    };
  }

  start(): void {
    if (this.timerId) return;
    const config = db.getConfig();
    this.timerId = setInterval(() => {
      this.runCycle();
    }, config.workerIntervalMs);
    this.notify();
  }

  stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.notify();
    }
  }

  setDemoMode(enabled: boolean): void {
    db.updateConfig({ demoMode: enabled });
    this.notify();
  }

  /**
   * Core cleanup cycle:
   * Scans for expired reservations, locks respective tiers, marks as EXPIRED,
   * and triggers cache invalidation.
   */
  async runCycle(): Promise<number> {
    if (this.isProcessing) return 0;
    this.isProcessing = true;
    const now = new Date().toISOString();
    let expiredInCycle = 0;

    try {
      const reservations = db.getReservations();
      const expiredTargets = reservations.filter(
        (r) => r.status === 'ACTIVE' && r.expiresAt <= now
      );

      if (expiredTargets.length > 0) {
        // Group by ticket tier so we can lock atomically per tier
        const tiersToInvalidate = new Set<string>();

        for (const target of expiredTargets) {
          const lockKey = `tier_lock_${target.ticketTierId}`;
          await runTransaction(lockKey, async () => {
            // Re-read current state to avoid race condition
            const current = db.getReservationById(target.id);
            if (current && current.status === 'ACTIVE' && current.expiresAt <= now) {
              current.status = 'EXPIRED';
              db.saveReservation(current);
              expiredInCycle++;
              tiersToInvalidate.add(target.ticketTierId);
            }
          });
        }

        if (tiersToInvalidate.size > 0) {
          // Invalidate cached event listings and tier detail queries
          systemCache.invalidatePrefix('events');
          systemCache.invalidatePrefix('tier');
          systemCache.invalidatePrefix('organizer');
        }
      }

      this.lastExpiredCount = expiredInCycle;
      this.totalExpired += expiredInCycle;
      this.lastRunAt = new Date().toLocaleTimeString();
      this.notify();
      return expiredInCycle;
    } catch (err) {
      console.error('[Worker] Expiry cycle encountered error:', err);
      return 0;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const expiryWorker = new ReservationExpiryWorker();
