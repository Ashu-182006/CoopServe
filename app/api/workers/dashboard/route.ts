import { NextRequest } from "next/server";
import { db } from "@/db";
import { workers, workerRatingStats, welfareWallet, payments, bookings } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, sum } from "drizzle-orm";

export const GET = withAuth(async (req, jwtUser) => {

  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker not found", 404);

  // Stats
  const [stats] = await db.select().from(workerRatingStats).where(eq(workerRatingStats.workerId, worker.id));
  const [wallet] = await db.select().from(welfareWallet).where(eq(welfareWallet.workerId, worker.id));

  // Earnings
  const earningsData = await db
    .select({ total: sum(payments.workerPayout) })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(eq(bookings.workerId, worker.id));
  
  const totalEarnings = parseInt(earningsData[0]?.total || "0", 10);

  return apiOk({
    isOnline: worker.isOnline,
    category: worker.category,
    passportId: worker.passportId,
    stats: stats || { nReviews: 0, simpleAvg: 0, bayesianAvg: 3.9 },
    wallet: wallet || { pmsbyEnrolled: false, contributionsTotal: 0, surplusBalance: 0 },
    totalEarnings,
  });
}, ["worker"]);

export const PUT = withAuth(async (req, jwtUser) => {
  const body = await req.json();

  if (typeof body.isOnline !== "boolean") return apiError("Invalid payload", 400);

  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker not found", 404);

  await db.update(workers).set({ isOnline: body.isOnline }).where(eq(workers.id, worker.id));

  return apiOk({ success: true, isOnline: body.isOnline });
}, ["worker"]);
