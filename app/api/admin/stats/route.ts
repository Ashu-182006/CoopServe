import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { apiOk } from "@/lib/api-middleware";
import { sum, count, eq } from "drizzle-orm";

export const GET = async (req: NextRequest) => {
  // Aggregate stats from payments
  const [paymentStats] = await db.select({
    totalTransfers: sum(payments.workerPayout),
    totalWelfare: sum(payments.welfareFee),
  }).from(payments).where(eq(payments.payoutStatus, "processed"));

  const [refundStats] = await db.select({
    totalRefunds: sum(payments.amount),
  }).from(payments).where(eq(payments.escrowStatus, "refunded"));

  const [bookingStats] = await db.select({
    totalBookings: count(bookings.id),
  }).from(bookings);

  return apiOk({
    stats: {
      totalTransfers: parseInt(paymentStats?.totalTransfers || "0", 10),
      totalWelfare: parseInt(paymentStats?.totalWelfare || "0", 10),
      totalRefunds: parseInt(refundStats?.totalRefunds || "0", 10),
      totalBookings: bookingStats?.totalBookings || 0,
    }
  });
};
