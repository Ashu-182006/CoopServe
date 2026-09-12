import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "quoted") return apiError("No quote available to reject", 409);

  const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
  if (!customer || customer.id !== booking.customerId) return apiError("Forbidden", 403);

  let rankedWorkers: string[] = [];
  try {
    if (booking.rankedWorkers) {
      rankedWorkers = JSON.parse(booking.rankedWorkers);
    }
  } catch (e) {
    // ignore parsing error
  }

  const nextRank = booking.currentRank + 1;

  if (nextRank < rankedWorkers.length) {
    // Cascade to next worker
    const nextWorkerId = rankedWorkers[nextRank];
    await db.update(bookings).set({
      status: "matched", // Change from "pending" to "matched" to trigger worker ping
      workerId: nextWorkerId,
      currentRank: nextRank,
      pingExpiresAt: new Date(Date.now() + 90 * 1000), // 90s window
      quoteWage: null,
      quotePartsCost: null,
      updatedAt: new Date(),
    }).where(eq(bookings.id, id));

    return apiOk({ success: true, message: "Quote rejected. Cascaded to next worker." });
  } else {
    // No more workers available
    await db.update(bookings).set({
      status: "cancelled",
      updatedAt: new Date(),
    }).where(eq(bookings.id, id));

    return apiOk({ success: true, message: "Quote rejected. No more workers available, booking cancelled." });
  }
}, ["customer"]);
