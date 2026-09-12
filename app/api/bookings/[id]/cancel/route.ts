import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers, payments, workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);

  if (jwtUser.role === "customer") {
    const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
    if (!customer || customer.id !== booking.customerId) return apiError("Forbidden", 403);
  } else if (jwtUser.role === "worker") {
    const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
    if (!worker || worker.id !== booking.workerId) return apiError("Forbidden", 403);
  } else {
    return apiError("Forbidden", 403);
  }

  await db.update(bookings).set({
    status: "cancelled",
    updatedAt: new Date(),
  }).where(eq(bookings.id, id));

  // If there's a payment, mark it as refunded
  if (booking.status === "paid" || booking.status === "in_progress") {
    await db.update(payments).set({
      escrowStatus: "refunded",
      updatedAt: new Date(),
    }).where(eq(payments.bookingId, id));
  }

  return apiOk({ success: true, message: "Booking cancelled and refund initiated." });
}, ["customer", "worker"]);
