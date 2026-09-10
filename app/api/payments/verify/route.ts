import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, bookings } from "@/db/schema";
import { apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return apiError("Missing required Razorpay parameters", 400);
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return apiError("Server configuration error", 500);

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return apiError("Invalid signature", 400);
    }

    // Find payment record
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, razorpay_order_id));

    if (!payment) return apiError("Payment record not found", 404);

    // Generate unique 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Update payment
    await db
      .update(payments)
      .set({
        escrowStatus: "held",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Update booking status to paid and store OTP
    await db
      .update(bookings)
      .set({
        status: "paid",
        otp,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, payment.bookingId));

    return apiOk({ success: true, otp });
  } catch (err: any) {
    return apiError(err.message, 500);
  }
}
