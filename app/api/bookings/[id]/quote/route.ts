import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";
import { z } from "zod";

const quoteSchema = z.object({
  wage:       z.number().min(1),   // in rupees
  partsCost:  z.number().min(0),   // in rupees
});

// POST /api/bookings/[id]/quote
export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const body = await req.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid quote data", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "quoted") return apiError("Booking is not in quoting stage", 409);

  if (booking.quoteExpiresAt && new Date() > booking.quoteExpiresAt) {
    return apiError("Quote window expired", 410);
  }

  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker || worker.id !== booking.workerId) return apiError("Forbidden", 403);

  await db.update(bookings).set({
    quoteWage:      Math.round(parsed.data.wage * 100),       // store in paise
    quotePartsCost: Math.round(parsed.data.partsCost * 100),
    status: "quoted",
    updatedAt: new Date(),
  }).where(eq(bookings.id, id));

  return apiOk({ success: true });
}, ["worker"]);
