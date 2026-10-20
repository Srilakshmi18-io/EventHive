/**
 * ============================================================================
 * SIMULATED DATABASE LAYER (localStorage backed)
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * Relational PostgreSQL database tables, foreign keys, sequence generators,
 * and JSON storage. Every read and write is encapsulated to prevent external
 * tampering, and operations are synced to browser storage.
 * ============================================================================
 */

import {
  User,
  EventItem,
  TicketTier,
  Reservation,
  Order,
  Payment,
  Ticket,
  TierAvailability,
} from '../types';
import {
  SEED_USERS,
  SEED_EVENTS,
  SEED_TIERS,
  SEED_ORDERS,
  SEED_PAYMENTS,
  SEED_TICKETS,
} from './seedData';

const DB_PREFIX = 'eventhive_db_';
const KEYS = {
  USERS: `${DB_PREFIX}users`,
  EVENTS: `${DB_PREFIX}events`,
  TIERS: `${DB_PREFIX}tiers`,
  RESERVATIONS: `${DB_PREFIX}reservations`,
  ORDERS: `${DB_PREFIX}orders`,
  PAYMENTS: `${DB_PREFIX}payments`,
  TICKETS: `${DB_PREFIX}tickets`,
  CONFIG: `${DB_PREFIX}config`,
};

export interface SystemConfig {
  demoMode: boolean; // if true, hold is 30s; if false, 10 min
  holdDurationSeconds: number;
  workerIntervalMs: number;
}

class SimulatedDB {
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    if (!localStorage.getItem(KEYS.USERS)) {
      this.setTable(KEYS.USERS, SEED_USERS);
    }
    if (!localStorage.getItem(KEYS.EVENTS)) {
      this.setTable(KEYS.EVENTS, SEED_EVENTS);
    }
    if (!localStorage.getItem(KEYS.TIERS)) {
      this.setTable(KEYS.TIERS, SEED_TIERS);
    }
    if (!localStorage.getItem(KEYS.RESERVATIONS)) {
      this.setTable(KEYS.RESERVATIONS, []);
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      this.setTable(KEYS.ORDERS, SEED_ORDERS);
    }
    if (!localStorage.getItem(KEYS.PAYMENTS)) {
      this.setTable(KEYS.PAYMENTS, SEED_PAYMENTS);
    }
    if (!localStorage.getItem(KEYS.TICKETS)) {
      this.setTable(KEYS.TICKETS, SEED_TICKETS);
    }
    if (!localStorage.getItem(KEYS.CONFIG)) {
      const defaultConfig: SystemConfig = {
        demoMode: false,
        holdDurationSeconds: 600, // 10 minutes
        workerIntervalMs: 10000,
      };
      this.setTable(KEYS.CONFIG, defaultConfig);
    }

    this.initialized = true;
  }

  private getTable<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setTable<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[DB] Failed to persist key ${key}:`, e);
    }
  }

  // --- CONFIG ---
  getConfig(): SystemConfig {
    return this.getTable<SystemConfig>(KEYS.CONFIG, {
      demoMode: false,
      holdDurationSeconds: 600,
      workerIntervalMs: 10000,
    });
  }

  updateConfig(updates: Partial<SystemConfig>): SystemConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    if (updates.demoMode !== undefined) {
      updated.holdDurationSeconds = updates.demoMode ? 30 : 600;
    }
    this.setTable(KEYS.CONFIG, updated);
    return updated;
  }

  // --- USERS ---
  getUsers(): User[] {
    return this.getTable<User[]>(KEYS.USERS, []);
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  saveUser(user: User): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.setTable(KEYS.USERS, users);
    return user;
  }

  // --- EVENTS ---
  getEvents(): EventItem[] {
    return this.getTable<EventItem[]>(KEYS.EVENTS, []);
  }

  getEventById(id: string): EventItem | undefined {
    return this.getEvents().find((e) => e.id === id);
  }

  saveEvent(event: EventItem): EventItem {
    const events = this.getEvents();
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      events[idx] = event;
    } else {
      events.push(event);
    }
    this.setTable(KEYS.EVENTS, events);
    return event;
  }

  // --- TIERS ---
  getTiers(): TicketTier[] {
    return this.getTable<TicketTier[]>(KEYS.TIERS, []);
  }

  getTiersByEventId(eventId: string): TicketTier[] {
    return this.getTiers()
      .filter((t) => t.eventId === eventId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getTierById(id: string): TicketTier | undefined {
    return this.getTiers().find((t) => t.id === id);
  }

  saveTier(tier: TicketTier): TicketTier {
    const tiers = this.getTiers();
    const idx = tiers.findIndex((t) => t.id === tier.id);
    if (idx >= 0) {
      tiers[idx] = tier;
    } else {
      tiers.push(tier);
    }
    this.setTable(KEYS.TIERS, tiers);
    return tier;
  }

  deleteTiersByEventId(eventId: string): void {
    const remaining = this.getTiers().filter((t) => t.eventId !== eventId);
    this.setTable(KEYS.TIERS, remaining);
  }

  // --- RESERVATIONS ---
  getReservations(): Reservation[] {
    return this.getTable<Reservation[]>(KEYS.RESERVATIONS, []);
  }

  getReservationById(id: string): Reservation | undefined {
    return this.getReservations().find((r) => r.id === id);
  }

  saveReservation(res: Reservation): Reservation {
    const list = this.getReservations();
    const idx = list.findIndex((r) => r.id === res.id);
    if (idx >= 0) {
      list[idx] = res;
    } else {
      list.push(res);
    }
    this.setTable(KEYS.RESERVATIONS, list);
    return res;
  }

  // --- ORDERS ---
  getOrders(): Order[] {
    return this.getTable<Order[]>(KEYS.ORDERS, []);
  }

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  }

  getOrderByReservationId(reservationId: string): Order | undefined {
    return this.getOrders().find((o) => o.reservationId === reservationId);
  }

  getOrderByPaymentId(paymentId: string): Order | undefined {
    return this.getOrders().find((o) => o.paymentId === paymentId);
  }

  getOrderByPaymentKey(idempotencyKey: string): Order | undefined {
    return this.getOrders().find((o) => o.idempotencyKey === idempotencyKey);
  }

  saveOrder(order: Order): Order {
    const list = this.getOrders();
    const idx = list.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.push(order);
    }
    this.setTable(KEYS.ORDERS, list);
    return order;
  }

  // --- PAYMENTS ---
  getPayments(): Payment[] {
    return this.getTable<Payment[]>(KEYS.PAYMENTS, []);
  }

  savePayment(payment: Payment): Payment {
    const list = this.getPayments();
    const idx = list.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      list[idx] = payment;
    } else {
      list.push(payment);
    }
    this.setTable(KEYS.PAYMENTS, list);
    return payment;
  }

  // --- TICKETS ---
  getTickets(): Ticket[] {
    return this.getTable<Ticket[]>(KEYS.TICKETS, []);
  }

  getTicketsByOrderId(orderId: string): Ticket[] {
    return this.getTickets().filter((t) => t.orderId === orderId);
  }

  getTicketsByUserId(userId: string): Ticket[] {
    return this.getTickets().filter((t) => t.userId === userId);
  }

  saveTicket(ticket: Ticket): Ticket {
    const list = this.getTickets();
    const idx = list.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      list[idx] = ticket;
    } else {
      list.push(ticket);
    }
    this.setTable(KEYS.TICKETS, list);
    return ticket;
  }

  saveTickets(newTickets: Ticket[]): void {
    const list = this.getTickets();
    for (const t of newTickets) {
      const idx = list.findIndex((x) => x.id === t.id);
      if (idx >= 0) {
        list[idx] = t;
      } else {
        list.push(t);
      }
    }
    this.setTable(KEYS.TICKETS, list);
  }

  // --- AVAILABILITY CALCULATION ---
  /**
   * Evaluates atomic real-time tier availability:
   * available = total - sold - activeHeld
   */
  calculateTierAvailability(tierId: string): TierAvailability | null {
    const tier = this.getTierById(tierId);
    if (!tier) return null;

    const now = new Date();

    // 1. Calculate sold tickets from PAID orders
    const paidOrders = this.getOrders().filter(
      (o) => o.ticketTierId === tierId && o.status === 'PAID'
    );
    const sold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);

    // 2. Calculate active holds (status === 'ACTIVE' AND expiresAt > now)
    const activeHolds = this.getReservations().filter(
      (r) =>
        r.ticketTierId === tierId &&
        r.status === 'ACTIVE' &&
        new Date(r.expiresAt).getTime() > now.getTime()
    );
    const activeHeld = activeHolds.reduce((sum, r) => sum + r.quantity, 0);

    // 3. Compute available remaining
    const available = Math.max(0, tier.totalQuantity - sold - activeHeld);

    // Check cutoff
    const isCutoffReached = Boolean(
      tier.salesCutoff && new Date(tier.salesCutoff).getTime() < now.getTime()
    );

    return {
      tierId,
      total: tier.totalQuantity,
      sold,
      activeHeld,
      available,
      isSoldOut: available <= 0,
      isCutoffReached,
    };
  }

  /**
   * Reset database back to seed state (useful for stress tests and demos)
   */
  resetToSeeds(): void {
    this.setTable(KEYS.USERS, SEED_USERS);
    this.setTable(KEYS.EVENTS, SEED_EVENTS);
    this.setTable(KEYS.TIERS, SEED_TIERS);
    this.setTable(KEYS.RESERVATIONS, []);
    this.setTable(KEYS.ORDERS, SEED_ORDERS);
    this.setTable(KEYS.PAYMENTS, SEED_PAYMENTS);
    this.setTable(KEYS.TICKETS, SEED_TICKETS);
  }
}

export const db = new SimulatedDB();
