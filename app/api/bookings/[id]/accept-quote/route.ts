import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers, payments } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/bookings/[id]/accept-quote — customer accepts quote → create Razorpay order
export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "quoted") return apiError("No quote available to accept", 409);
  if (!booking.quoteWage) return apiError("Worker has not submitted a quote yet", 409);

  const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
  if (!customer || customer.id !== booking.customerId) return apiError("Forbidden", 403);

  const totalPaise = (booking.quoteWage ?? 0) + (booking.quotePartsCost ?? 0);

  // Create Razorpay order (test mode)
  const order = await razorpay.orders.create({
    amount:   totalPaise,
    currency: "INR",
    receipt:  `booking_${id.slice(0, 8)}`,
    notes:    { bookingId: id },
  });

  // Mark booking accepted
  await db.update(bookings).set({ status: "accepted", updatedAt: new Date() }).where(eq(bookings.id, id));

  // Create payment record
  const platformFee = Math.round(totalPaise * 0.025);
  const welfareFee  = Math.round(totalPaise * 0.025);
  const workerPayout = totalPaise - platformFee - welfareFee;

  await db.insert(payments).values({
    bookingId:       id,
    amount:          totalPaise,
    escrowStatus:    "pending",
    platformFee,
    welfareFee,
    workerPayout,
    razorpayOrderId: order.id,
  });

  return apiOk({
    orderId:   order.id,
    amount:    totalPaise,
    currency:  "INR",
    keyId:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}, ["customer"]);
