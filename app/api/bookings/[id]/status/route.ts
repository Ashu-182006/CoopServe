import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, workers, customers, users, payments, workerRatingStats } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

// GET /api/bookings/[id]/status — polling endpoint for booking state
export const GET = withAuth(async (req, _jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);

  // Fetch worker info if assigned
  let workerInfo = null;
  if (booking.workerId) {
    const [w] = await db
      .select({ id: workers.id, passportId: workers.passportId, locationLat: workers.locationLat, locationLng: workers.locationLng, category: workers.category, certificationStatus: workers.certificationStatus, bayesianAvg: workerRatingStats.bayesianAvg, photoUrl: workers.photoUrl })
      .from(workers)
      .leftJoin(workerRatingStats, eq(workers.id, workerRatingStats.workerId))
      .where(eq(workers.id, booking.workerId));

    if (w) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, (await db.select({ userId: workers.userId }).from(workers).where(eq(workers.id, booking.workerId)))[0]?.userId ?? ""));
      workerInfo = { ...w, name: u?.name ?? "Worker" };
    }
  }

  // Fetch customer info
  let customerInfo = null;
  const [c] = await db
    .select({ name: users.name, address: customers.address })
    .from(customers)
    .innerJoin(users, eq(customers.userId, users.id))
    .where(eq(customers.id, booking.customerId));
  if (c) {
    customerInfo = c;
  }

  // Fetch payment if exists
  const [payment] = await db.select().from(payments).where(eq(payments.bookingId, id));

  return apiOk({ booking, worker: workerInfo, customer: customerInfo, payment: payment ?? null });
});
