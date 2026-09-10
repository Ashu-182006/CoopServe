"use server"

import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function simulateWorkerQuote(bookingId: string) {
  await db.update(bookings).set({
    status: "quoted",
    quoteWage: 50000, // 500 rupees
    quotePartsCost: 20000, // 200 rupees
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));
}

export async function acceptQuoteAndPay(bookingId: string) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  await db.update(bookings).set({
    status: "paid",
    otp,
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));
}

export async function simulateWorkerCompletion(bookingId: string) {
  await db.update(bookings).set({
    status: "completed",
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));
}
