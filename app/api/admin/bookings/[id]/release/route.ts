import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, payments, welfareWallet } from "@/db/schema";
import { apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const POST = async (req: NextRequest, ctx: any) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  // In a real app, verify admin session here.
  
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "paid" && booking.status !== "in_progress") {
    return apiError("Booking is not in a state to be released", 400);
  }

  // Force release payment (simulate what /complete does but without OTP)
  // 1. Calculate Payouts
  const totalAmount = (booking.quoteWage || 0) + (booking.quotePartsCost || 0);
  const platformFee = Math.floor(totalAmount * 0.05); // 5% total fee
  const welfareContribution = Math.floor(platformFee * 0.5); // 2.5% of total
  const workerPayout = totalAmount - platformFee;

  // 2. Create Payment Record (Simulating Escrow Release)
  await db.insert(payments).values({
    bookingId: id,
    amount: totalAmount,
    platformFee,
    welfareContribution,
    workerPayout,
    status: "released",
  });

  // 3. Update Welfare Wallet
  if (booking.workerId) {
    const [wallet] = await db.select().from(welfareWallet).where(eq(welfareWallet.workerId, booking.workerId));
    if (wallet) {
      await db.update(welfareWallet).set({
        contributionsTotal: (wallet.contributionsTotal || 0) + welfareContribution,
        updatedAt: new Date()
      }).where(eq(welfareWallet.id, wallet.id));
    }
  }

  // 4. Update Booking Status
  await db.update(bookings).set({ status: "completed", updatedAt: new Date() }).where(eq(bookings.id, id));

  return apiOk({ success: true, message: "Payment released and booking completed." });
};
