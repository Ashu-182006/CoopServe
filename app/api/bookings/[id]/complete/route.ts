import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers, payments, welfareWallet, workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const body = await req.json();
  const { otp } = body;
  if (!otp) return apiError("Missing OTP", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "paid" && booking.status !== "in_progress") {
    return apiError(`Cannot complete booking in ${booking.status} status`, 409);
  }

  // Verify ownership based on role
  if (jwtUser.role === "customer") {
    const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
    if (!customer || customer.id !== booking.customerId) return apiError("Forbidden", 403);
  } else if (jwtUser.role === "worker") {
    const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
    if (!worker || worker.id !== booking.workerId) return apiError("Forbidden", 403);
  } else {
    return apiError("Forbidden", 403);
  }

  // Verify OTP
  if (booking.otp !== otp) {
    return apiError("Invalid OTP", 400);
  }

  // Find associated payment
  const [payment] = await db.select().from(payments).where(eq(payments.bookingId, id));
  if (!payment) return apiError("Payment record not found", 404);

  // Update booking to completed
  await db.update(bookings).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(bookings.id, id));

  // Release payment (escrowStatus -> released)
  await db.update(payments).set({ escrowStatus: "released", payoutStatus: "processed", updatedAt: new Date() }).where(eq(payments.id, payment.id));

  // Update welfare wallet contributions
  if (booking.workerId && payment.welfareFee) {
    const [wallet] = await db.select().from(welfareWallet).where(eq(welfareWallet.workerId, booking.workerId));
    if (wallet) {
      await db.update(welfareWallet).set({
        contributionsTotal: wallet.contributionsTotal + payment.welfareFee,
        updatedAt: new Date()
      }).where(eq(welfareWallet.workerId, booking.workerId));
    } else {
      await db.insert(welfareWallet).values({
        workerId: booking.workerId,
        contributionsTotal: payment.welfareFee,
      });
    }
  }

  return apiOk({ success: true, message: "Booking completed and payment released" });
}, ["customer", "worker"]);
