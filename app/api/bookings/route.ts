import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, customers, workers, workerRatingStats } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { rankWorkers, WorkerCandidate } from "@/lib/fair-rotation";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

const createSchema = z.object({
  category:    z.string().min(1),
  description: z.string().min(5),
  beforeImageUrl: z.string().optional(),
  customerLat: z.number(),
  customerLng: z.number(),
});

// POST /api/bookings — create booking + run Fair Rotation matching
export const POST = withAuth(async (req, jwtUser) => {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", 400);

  const { category, description, beforeImageUrl, customerLat, customerLng } = parsed.data;

  // Get customer profile
  const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
  if (!customer) return apiError("Customer profile not found", 404);

  // ── Fair Rotation: find eligible workers ──────────────────────────────────
  // Use lat/lng columns instead of PostGIS for simplicity — calculate distance in JS
  const eligibleWorkers = await db
    .select({
      workerId:            workers.id,
      locationLat:         workers.locationLat,
      locationLng:         workers.locationLng,
      lastJobCompletedAt:  workers.lastJobCompletedAt,
      certificationStatus: workers.certificationStatus,
      certJoinedAt:        workers.certJoinedAt,
      bayesianAvg:         workerRatingStats.bayesianAvg,
    })
    .from(workers)
    .leftJoin(workerRatingStats, eq(workers.id, workerRatingStats.workerId))
    .where(and(eq(workers.category, category), eq(workers.isOnline, true)));

  if (eligibleWorkers.length === 0) {
    const [booking] = await db.insert(bookings).values({
      customerId:    customer.id,
      category,
      description,
      customerLat,
      customerLng,
      beforeImageUrl,
      status:        "pending",
      rankedWorkers: "[]",
      currentRank:   0,
    }).returning();
    
    return apiOk({
      booking,
      rankedWorkers: [],
      message: "No workers online currently. Booking created in pending state."
    }, 201);
  }

  // Calculate distances and build candidates
  const R = 6371; // Earth radius km
  const candidates: WorkerCandidate[] = eligibleWorkers
    .filter(w => w.locationLat && w.locationLng)
    .map(w => {
      const dLat = ((w.locationLat! - customerLat) * Math.PI) / 180;
      const dLng = ((w.locationLng! - customerLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((customerLat * Math.PI) / 180) * Math.cos((w.locationLat! * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const distanceKm = 2 * R * Math.asin(Math.sqrt(a));
      return {
        workerId:            w.workerId,
        distanceKm,
        bayesianAvg:         w.bayesianAvg ?? 3.9,
        lastJobCompletedAt:  w.lastJobCompletedAt,
        certificationStatus: w.certificationStatus,
        certJoinedAt:        w.certJoinedAt,
      };
    })
    .filter(c => c.distanceKm <= 10); // within 10km

  if (candidates.length === 0) {
    const [booking] = await db.insert(bookings).values({
      customerId:    customer.id,
      category,
      description,
      customerLat,
      customerLng,
      beforeImageUrl,
      status:        "pending",
      rankedWorkers: "[]",
      currentRank:   0,
    }).returning();
    
    return apiOk({
      booking,
      rankedWorkers: [],
      message: "No workers online currently within 10km. Booking created in pending state."
    }, 201);
  }

  const ranked = rankWorkers(candidates);
  const rankedIds = ranked.map(r => r.workerId);

  // Create booking
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const pingExpiresAt = new Date(Date.now() + 60_000); // 60s window

  const [booking] = await db.insert(bookings).values({
    customerId:    customer.id,
    workerId:      ranked[0].workerId,
    category,
    description,
    customerLat,
    customerLng,
    beforeImageUrl,
    status:        "matched",
    otp,
    rankedWorkers: JSON.stringify(rankedIds),
    currentRank:   0,
    pingExpiresAt,
  }).returning();

  return apiOk({
    booking,
    rankedWorkers: ranked.map(r => ({
      workerId: r.workerId,
      score:    parseFloat(r.score.toFixed(3)),
      breakdown: r.scoreBreakdown,
    })),
  }, 201);
}, ["customer"]);

// GET /api/bookings
export const GET = withAuth(async (req) => {
  const [customer] = await db.select().from(customers).where(
    eq(customers.userId, (req as NextRequest & { jwtUser: { sub: string } }).jwtUser.sub)
  );
  if (!customer) return apiError("Customer profile not found", 404);
  const list = await db.select().from(bookings).where(eq(bookings.customerId, customer.id));
  return apiOk(list);
}, ["customer"]);
