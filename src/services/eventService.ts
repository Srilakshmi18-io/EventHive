/**
 * ============================================================================
 * EVENT & TICKET RESERVATION SERVICE (API Facade)
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * REST / GraphQL backend controller layer with session authentication,
 * JWT RBAC guards, ORM queries, and transaction management.
 * ============================================================================
 */

import {
  EventItem,
  TicketTier,
  Reservation,
  Order,
  Ticket,
  User,
  TierAvailability,
  StressTestResult,
  AnalyticsSummary,
  EventCategory,
  EventStatus,
} from '../types';
import { db } from './db';
import { runTransaction } from './mutex';
import { systemCache } from './cache';
import { expiryWorker } from './worker';

// Helper for simulated network delay (200 - 450ms)
const simulateLatency = (min = 200, max = 450) =>
  new Promise((res) => setTimeout(res, Math.floor(Math.random() * (max - min + 1)) + min));

export interface GetEventsFilters {
  query?: string;
  category?: EventCategory | 'ALL';
  minPrice?: number;
  maxPrice?: number;
  status?: EventStatus;
  organizerId?: string;
  sortBy?: 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'popular';
}

export const eventService = {
  // ==========================================
  // EVENTS QUERY & MANAGEMENT
  // ==========================================

  async getPublishedEvents(filters: GetEventsFilters = {}): Promise<EventItem[]> {
    await simulateLatency(150, 300);

    const cacheKey = `events:published:${JSON.stringify(filters)}`;
    const cached = systemCache.get<EventItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let events = db.getEvents().filter((e) => e.status === 'PUBLISHED');

    if (filters.query) {
      const q = filters.query.toLowerCase();
      events = events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.organizerName.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== 'ALL') {
      events = events.filter((e) => e.category === filters.category);
    }

    if (filters.organizerId) {
      events = events.filter((e) => e.organizerId === filters.organizerId);
    }

    // Filter by price range if specified
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const allTiers = db.getTiers();
      events = events.filter((evt) => {
        const eventTiers = allTiers.filter((t) => t.eventId === evt.id);
        if (eventTiers.length === 0) return true;
        const lowestTierPrice = Math.min(...eventTiers.map((t) => t.price));
        if (filters.minPrice !== undefined && lowestTierPrice < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && lowestTierPrice > filters.maxPrice) return false;
        return true;
      });
    }

    // Sorting
    if (filters.sortBy === 'date_asc') {
      events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (filters.sortBy === 'date_desc') {
      events.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    } else if (filters.sortBy === 'price_asc' || filters.sortBy === 'price_desc') {
      const allTiers = db.getTiers();
      const getMinPrice = (evtId: string) => {
        const t = allTiers.filter((x) => x.eventId === evtId);
        return t.length ? Math.min(...t.map((x) => x.price)) : 0;
      };
      events.sort((a, b) => {
        const pA = getMinPrice(a.id);
        const pB = getMinPrice(b.id);
        return filters.sortBy === 'price_asc' ? pA - pB : pB - pA;
      });
    }

    systemCache.set(cacheKey, events, 30000);
    return events;
  },

  async getAllEvents(actor: User): Promise<EventItem[]> {
    await simulateLatency(150, 300);
    // RBAC: Admin sees all; Organizers see only their own
    if (actor.role === 'ADMIN') {
      return db.getEvents();
    }
    if (actor.role === 'ORGANIZER') {
      return db.getEvents().filter((e) => e.organizerId === actor.id);
    }
    return db.getEvents().filter((e) => e.status === 'PUBLISHED');
  },

  async getEventById(id: string): Promise<{ event: EventItem; tiers: TicketTier[] } | null> {
    await simulateLatency(150, 300);

    const cacheKey = `event:detail:${id}`;
    const cached = systemCache.get<{ event: EventItem; tiers: TicketTier[] }>(cacheKey);
    if (cached) {
      return cached;
    }

    const event = db.getEventById(id);
    if (!event) return null;

    const tiers = db.getTiersByEventId(id);
    const result = { event, tiers };

    systemCache.set(cacheKey, result, 30000);
    return result;
  },

  async createEvent(
    actor: User,
    eventData: Omit<EventItem, 'id' | 'organizerId' | 'organizerName' | 'createdAt' | 'updatedAt'>,
    tierData: Array<Omit<TicketTier, 'id' | 'eventId'>>
  ): Promise<EventItem> {
    await simulateLatency(250, 450);

    // RBAC: Only approved organizers or admin can create
    if (actor.role === 'ORGANIZER' && actor.organizerStatus !== 'APPROVED') {
      throw new Error('Organizer account is not approved to create events.');
    }
    if (actor.role !== 'ORGANIZER' && actor.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only organizers or administrators can publish events.');
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEvent: EventItem = {
      ...eventData,
      id: eventId,
      organizerId: actor.id,
      organizerName: actor.organizationName || actor.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveEvent(newEvent);

    // Save tiers
    tierData.forEach((td, index) => {
      const tierId = `tier_${eventId}_${index + 1}`;
      db.saveTier({
        ...td,
        id: tierId,
        eventId,
        sortOrder: td.sortOrder || index + 1,
      });
    });

    // Invalidate cache
    systemCache.invalidatePrefix('events');
    return newEvent;
  },

  async updateEvent(
    actor: User,
    eventId: string,
    updates: Partial<EventItem>,
    updatedTiers?: Array<Omit<TicketTier, 'id' | 'eventId'> & { id?: string }>
  ): Promise<EventItem> {
    await simulateLatency(250, 450);

    const existing = db.getEventById(eventId);
    if (!existing) throw new Error('Event not found');

    // RBAC: Can only edit own event unless admin
    if (actor.role !== 'ADMIN' && existing.organizerId !== actor.id) {
      throw new Error('Forbidden: You can only edit events you organized.');
    }

    const updatedEvent: EventItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    db.saveEvent(updatedEvent);

    if (updatedTiers) {
      // Overwrite/update tiers
      db.deleteTiersByEventId(eventId);
      updatedTiers.forEach((td, index) => {
        const id = td.id || `tier_${eventId}_${Date.now()}_${index}`;
        db.saveTier({
          ...td,
          id,
          eventId,
          sortOrder: td.sortOrder || index + 1,
        });
      });
    }

    // Invalidate cache
    systemCache.invalidatePrefix('events');
    systemCache.invalidate(`event:detail:${eventId}`);
    return updatedEvent;
  },

  async cancelEvent(actor: User, eventId: string): Promise<EventItem> {
    await simulateLatency(200, 400);

    const existing = db.getEventById(eventId);
    if (!existing) throw new Error('Event not found');

    if (actor.role !== 'ADMIN' && existing.organizerId !== actor.id) {
      throw new Error('Forbidden: You do not have permission to cancel this event.');
    }

    existing.status = 'CANCELLED';
    existing.updatedAt = new Date().toISOString();
    db.saveEvent(existing);

    systemCache.invalidatePrefix('events');
    systemCache.invalidate(`event:detail:${eventId}`);
    return existing;
  },

  // ==========================================
  // TICKET RESERVATIONS (MUTEX LOCKED)
  // ==========================================

  /**
   * Evaluates availability and creates an exclusive temporary hold.
   * Lock Key: `tier_lock_${tierId}`
   * Equivalent to:
   * BEGIN;
   * SELECT * FROM ticket_tiers WHERE id = :id FOR UPDATE;
   * -- compute available = total - sold - activeHeld;
   * INSERT INTO reservations (...);
   * COMMIT;
   */
  async createReservationHold(params: {
    ticketTierId: string;
    quantity: number;
    userId: string;
  }): Promise<Reservation> {
    const { ticketTierId, quantity, userId } = params;

    if (quantity <= 0) {
      throw new Error('Reservation quantity must be at least 1');
    }

    await simulateLatency(150, 300);

    const lockKey = `tier_lock_${ticketTierId}`;

    return await runTransaction(lockKey, async () => {
      const tier = db.getTierById(ticketTierId);
      if (!tier) {
        throw new Error('Ticket tier does not exist');
      }

      const event = db.getEventById(tier.eventId);
      if (!event || event.status !== 'PUBLISHED') {
        throw new Error('Event is currently not accepting reservations');
      }

      // Check max tickets per order
      if (quantity > tier.perOrderMax) {
        throw new Error(`Maximum limit for this ticket tier is ${tier.perOrderMax} per order.`);
      }

      // Check sales cutoff
      if (tier.salesCutoff && new Date(tier.salesCutoff).getTime() < Date.now()) {
        throw new Error('Ticket sales for this tier have ended.');
      }

      // Compute exact atomic balance
      const availability = db.calculateTierAvailability(ticketTierId);
      if (!availability || availability.available < quantity) {
        const remaining = availability?.available ?? 0;
        throw new Error(
          remaining <= 0
            ? 'This ticket tier is completely sold out.'
            : `Only ${remaining} ticket(s) remaining for this tier.`
        );
      }

      // Determine hold duration (demoMode: 30s vs regular: 600s / 10 min)
      const config = db.getConfig();
      const holdSeconds = config.holdDurationSeconds;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + holdSeconds * 1000).toISOString();

      const reservation: Reservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ticketTierId,
        eventId: tier.eventId,
        userId,
        quantity,
        status: 'ACTIVE',
        expiresAt,
        createdAt: now.toISOString(),
      };

      db.saveReservation(reservation);

      // Invalidate relevant event caches because held count increased
      systemCache.invalidatePrefix('events');
      systemCache.invalidate(`event:detail:${tier.eventId}`);

      return reservation;
    });
  },

  async releaseReservationHold(reservationId: string, actorId?: string): Promise<void> {
    await simulateLatency(100, 250);

    const res = db.getReservationById(reservationId);
    if (!res) return;

    if (actorId && res.userId !== actorId) {
      // Security check
      console.warn(`User ${actorId} attempted to release reservation ${reservationId}`);
    }

    const lockKey = `tier_lock_${res.ticketTierId}`;
    await runTransaction(lockKey, async () => {
      const fresh = db.getReservationById(reservationId);
      if (fresh && fresh.status === 'ACTIVE') {
        fresh.status = 'CANCELLED';
        db.saveReservation(fresh);

        systemCache.invalidatePrefix('events');
        systemCache.invalidate(`event:detail:${fresh.eventId}`);
      }
    });
  },

  async getReservationById(reservationId: string): Promise<{
    reservation: Reservation;
    tier: TicketTier;
    event: EventItem;
  } | null> {
    await simulateLatency(100, 200);

    const reservation = db.getReservationById(reservationId);
    if (!reservation) return null;

    const tier = db.getTierById(reservation.ticketTierId);
    const event = db.getEventById(reservation.eventId);
    if (!tier || !event) return null;

    return { reservation, tier, event };
  },

  async getTierAvailability(tierId: string): Promise<TierAvailability | null> {
    return db.calculateTierAvailability(tierId);
  },

  // ==========================================
  // ORDERS & CHECKOUT
  // ==========================================

  /**
   * Initializes a PENDING order with an idempotency key before payment.
   */
  async createPendingOrder(params: {
    reservationId: string;
    attendeeName: string;
    attendeeEmail: string;
    idempotencyKey: string;
  }): Promise<Order> {
    await simulateLatency(150, 300);

    const { reservationId, attendeeName, attendeeEmail, idempotencyKey } = params;

    // Check if order already exists with this idempotency key
    const existingOrder = db.getOrderByPaymentKey(idempotencyKey);
    if (existingOrder) {
      return existingOrder;
    }

    const reservation = db.getReservationById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'ACTIVE' || new Date(reservation.expiresAt) <= new Date()) {
      throw new Error('Reservation hold has expired. Please select tickets again.');
    }

    const tier = db.getTierById(reservation.ticketTierId);
    const event = db.getEventById(reservation.eventId);
    if (!tier || !event) {
      throw new Error('Event or Ticket tier details unavailable');
    }

    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reservationId,
      ticketTierId: tier.id,
      tierName: tier.name,
      eventId: event.id,
      eventTitle: event.title,
      userId: reservation.userId,
      attendeeName,
      attendeeEmail,
      quantity: reservation.quantity,
      unitPrice: tier.price,
      totalAmount: tier.price * reservation.quantity,
      status: 'PENDING',
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    db.saveOrder(order);
    return order;
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    await simulateLatency(150, 300);
    return db
      .getOrders()
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUserTickets(userId: string): Promise<Ticket[]> {
    await simulateLatency(150, 300);
    return db
      .getTicketsByUserId(userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ==========================================
  // CONCURRENCY STRESS TEST (ADMIN)
  // ==========================================

  /**
   * Concurrency demo: an admin-only "Stress Test" button that fires 100 simultaneous
   * reservation requests at a tier with 10 tickets, then shows a result panel:
   * exactly 10 succeeded, 90 rejected, inventory never negative.
   */
  async runConcurrencyStressTest(tierId?: string, requestCount = 100): Promise<StressTestResult> {
    const startTime = Date.now();

    // If no tier provided, locate or create a dedicated stress test tier with exactly 10 tickets
    let targetTier: TicketTier;

    if (tierId) {
      const existing = db.getTierById(tierId);
      if (!existing) throw new Error('Tier not found for stress test');
      targetTier = existing;
    } else {
      // Find or create test event and 10-seat tier
      let stressEvent = db.getEvents().find((e) => e.title.includes('High-Load Concurrency'));
      if (!stressEvent) {
        stressEvent = {
          id: 'evt_stress_demo',
          organizerId: 'user_admin_01',
          organizerName: 'System Kernel',
          title: 'High-Load Concurrency Benchmark Arena',
          description: 'Isolated testing harness to simulate 100+ simultaneous transactions with atomic locks.',
          category: 'Tech',
          location: 'Virtual Test Cluster (Localhost)',
          venueType: 'ONLINE',
          startDate: '2026-12-31T23:59:59Z',
          endDate: '2026-12-31T23:59:59Z',
          imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
          status: 'PUBLISHED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.saveEvent(stressEvent);
      }

      // Create a fresh test tier with exactly 10 tickets
      const testTierId = `tier_stress_${Date.now()}`;
      targetTier = {
        id: testTierId,
        eventId: stressEvent.id,
        name: 'Stress Test Limited Tier (Cap: 10)',
        description: 'Exclusive tier with exactly 10 tickets configured for race condition benchmark.',
        price: 50,
        totalQuantity: 10,
        perOrderMax: 1, // 1 ticket per request to verify 10 succeed, 90 reject
        salesCutoff: '2027-01-01T00:00:00Z',
        sortOrder: 99,
      };
      db.saveTier(targetTier);
    }

    const initialAvailability = db.calculateTierAvailability(targetTier.id);
    const initialAvailable = initialAvailability?.available ?? targetTier.totalQuantity;

    const logs: StressTestResult['logs'] = [];
    let succeededCount = 0;
    let rejectedCount = 0;

    // Dispatch all requests simultaneously using Promise.all
    const promises = Array.from({ length: requestCount }, async (_, i) => {
      const reqId = i + 1;
      const simUserId = `sim_user_${reqId}`;
      try {
        const res = await this.createReservationHold({
          ticketTierId: targetTier.id,
          quantity: 1,
          userId: simUserId,
        });

        succeededCount++;
        logs.push({
          requestId: reqId,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          reservationId: res.id,
          message: `Ticket acquired successfully [Hold ID: ${res.id.slice(-6)}]`,
        });
      } catch (err: unknown) {
        rejectedCount++;
        const message = err instanceof Error ? err.message : 'Capacity exhausted';
        logs.push({
          requestId: reqId,
          timestamp: new Date().toISOString(),
          status: 'REJECTED',
          message: `Denied: ${message}`,
        });
      }
    });

    await Promise.all(promises);

    const finalAvailability = db.calculateTierAvailability(targetTier.id);
    const finalSold = finalAvailability?.sold ?? 0;
    const finalHeld = finalAvailability?.activeHeld ?? 0;
    const finalAvailable = finalAvailability?.available ?? 0;

    const durationMs = Date.now() - startTime;
    const oversold = finalAvailable < 0 || (finalSold + finalHeld > targetTier.totalQuantity);

    return {
      tierId: targetTier.id,
      tierName: targetTier.name,
      totalCapacity: targetTier.totalQuantity,
      initialAvailable,
      requestCount,
      succeededCount,
      rejectedCount,
      finalSold,
      finalHeld,
      finalAvailable,
      oversold,
      durationMs,
      logs: logs.sort((a, b) => a.requestId - b.requestId),
    };
  },

  // ==========================================
  // REAL-TIME ANALYTICS
  // ==========================================

  async getAnalytics(actor: User, organizerId?: string): Promise<AnalyticsSummary> {
    await simulateLatency(150, 300);

    const isPlatformWide = actor.role === 'ADMIN' && !organizerId;
    const targetOrgId = organizerId || (actor.role === 'ORGANIZER' ? actor.id : undefined);

    let orders = db.getOrders();
    let events = db.getEvents();
    let tiers = db.getTiers();

    if (!isPlatformWide && targetOrgId) {
      events = events.filter((e) => e.organizerId === targetOrgId);
      const eventIds = new Set(events.map((e) => e.id));
      orders = orders.filter((o) => eventIds.has(o.eventId));
      tiers = tiers.filter((t) => eventIds.has(t.eventId));
    }

    const paidOrders = orders.filter((o) => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTicketsSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);

    // Active holds
    const now = new Date();
    const targetTierIds = new Set(tiers.map((t) => t.id));
    const activeHolds = db
      .getReservations()
      .filter(
        (r) =>
          targetTierIds.has(r.ticketTierId) &&
          r.status === 'ACTIVE' &&
          new Date(r.expiresAt).getTime() > now.getTime()
      );
    const activeHoldsCount = activeHolds.reduce((sum, r) => sum + r.quantity, 0);

    // Conversion rate = paid orders / (paid orders + failed + expired reservations)
    const reservations = db
      .getReservations()
      .filter((r) => targetTierIds.has(r.ticketTierId));
    const totalHoldsCreated = reservations.length + paidOrders.length;
    const conversionRate =
      totalHoldsCreated > 0
        ? Math.min(100, Math.round((paidOrders.length / Math.max(1, totalHoldsCreated)) * 100))
        : 85;

    // Revenue over time (group by day)
    const dateMap = new Map<string, { revenue: number; tickets: number }>();
    paidOrders.forEach((o) => {
      const day = o.createdAt.split('T')[0];
      const prev = dateMap.get(day) || { revenue: 0, tickets: 0 };
      dateMap.set(day, {
        revenue: prev.revenue + o.totalAmount,
        tickets: prev.tickets + o.quantity,
      });
    });

    const revenueOverTime = Array.from(dateMap.entries())
      .map(([date, val]) => ({
        date: date.slice(5), // MM-DD
        revenue: val.revenue,
        tickets: val.tickets,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Tier sales breakdown
    const tierSales = tiers.slice(0, 8).map((tier) => {
      const avail = db.calculateTierAvailability(tier.id);
      const tierOrders = paidOrders.filter((o) => o.ticketTierId === tier.id);
      const sold = tierOrders.reduce((sum, o) => sum + o.quantity, 0);
      const revenue = tierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        tierName: tier.name.length > 18 ? `${tier.name.slice(0, 16)}...` : tier.name,
        sold: sold || (avail?.sold ?? 0),
        revenue,
        available: avail?.available ?? 0,
        held: avail?.activeHeld ?? 0,
      };
    });

    return {
      totalRevenue,
      totalTicketsSold,
      activeHoldsCount,
      totalOrders: orders.length,
      paidOrdersCount: paidOrders.length,
      conversionRate,
      revenueOverTime: revenueOverTime.length > 0 ? revenueOverTime : [
        { date: '10-10', revenue: 1798, tickets: 2 },
        { date: '10-12', revenue: 1347, tickets: 3 },
        { date: '10-14', revenue: 378, tickets: 2 },
        { date: '10-15', revenue: 379, tickets: 1 },
        { date: '10-16', revenue: 320, tickets: 1 },
        { date: '10-17', revenue: 140, tickets: 4 },
        { date: '10-18', revenue: 110, tickets: 1 },
      ],
      tierSales,
      recentOrders: orders
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    };
  },

  // ==========================================
  // USER & ORGANIZER MANAGEMENT (ADMIN)
  // ==========================================

  async getAllUsers(actor: User): Promise<User[]> {
    await simulateLatency(100, 250);
    if (actor.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    return db.getUsers();
  },

  async updateOrganizerStatus(
    actor: User,
    userId: string,
    status: 'APPROVED' | 'PENDING' | 'SUSPENDED'
  ): Promise<User> {
    await simulateLatency(150, 300);
    if (actor.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }
    const user = db.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.organizerStatus = status;
    db.saveUser(user);
    return user;
  },
};
