import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers, ratings, workerRatingStats } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, sql } from "drizzle-orm";

export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const body = await req.json();
  const { score, feedbackText } = body;

  if (typeof score !== "number" || score < 1 || score > 5) {
    return apiError("Score must be a number between 1 and 5", 400);
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "completed") return apiError("Booking must be completed to rate", 409);
  if (!booking.workerId) return apiError("No worker assigned to this booking", 400);

  const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
  if (!customer || customer.id !== booking.customerId) return apiError("Forbidden", 403);

  // 1. Insert Rating
  await db.insert(ratings).values({
    bookingId: booking.id,
    customerId: customer.id,
    workerId: booking.workerId,
    score,
    feedbackText: feedbackText || "",
  });

  // 2. Fetch all ratings for this worker to recalculate
  const allWorkerRatings = await db.select({ score: ratings.score }).from(ratings).where(eq(ratings.workerId, booking.workerId));
  
  const n = allWorkerRatings.length;
  const sumScores = allWorkerRatings.reduce((acc, r) => acc + r.score, 0);
  const workerAvg = n > 0 ? sumScores / n : 0;

  // Global platform average (or fallback to 4.0 if not enough data)
  // For simplicity and speed in this demo, we'll fetch global avg, or default to 4.0
  const globalRatings = await db.select({ score: ratings.score }).from(ratings);
  const globalSum = globalRatings.reduce((acc, r) => acc + r.score, 0);
  const c = 5; // confidence threshold
  const m = globalRatings.length >= c ? globalSum / globalRatings.length : 4.0;

  // Bayesian Formula
  const bayesianAvg = (c * m + n * workerAvg) / (c + n);

  // 3. Update worker_rating_stats
  const [stats] = await db.select().from(workerRatingStats).where(eq(workerRatingStats.workerId, booking.workerId));
  if (stats) {
    await db.update(workerRatingStats).set({
      nReviews: n,
      simpleAvg: workerAvg,
      bayesianAvg,
      updatedAt: new Date()
    }).where(eq(workerRatingStats.workerId, booking.workerId));
  } else {
    await db.insert(workerRatingStats).values({
      workerId: booking.workerId,
      nReviews: n,
      simpleAvg: workerAvg,
      bayesianAvg,
    });
  }

  // 4. Update booking status
  await db.update(bookings).set({ status: "rated", updatedAt: new Date() }).where(eq(bookings.id, id));

  return apiOk({ success: true, bayesianAvg });
}, ["customer"]);
