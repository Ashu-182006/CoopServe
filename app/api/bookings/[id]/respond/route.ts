import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";
import { z } from "zod";

const respondSchema = z.object({ action: z.enum(["accept", "decline"]) });

// POST /api/bookings/[id]/respond — worker accepts or declines a ping
export const POST = withAuth(async (req, jwtUser, ctx) => {
  const params = await ctx?.params; const id = params?.id;
  if (!id) return apiError("Missing booking ID", 400);

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid action", 400);

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return apiError("Booking not found", 404);
  if (booking.status !== "matched") return apiError("Booking is not awaiting a response", 409);

  // Check ping window
  if (booking.pingExpiresAt && new Date() > booking.pingExpiresAt) {
    // Cascade to next worker
    return apiError("Ping window expired — booking already cascaded", 410);
  }

  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker || worker.id !== booking.workerId) {
    return apiError("You are not assigned to this booking", 403);
  }

  if (parsed.data.action === "decline") {
    // Cascade to next ranked worker
    const rankedIds: string[] = JSON.parse(booking.rankedWorkers ?? "[]");
    const nextRank = (booking.currentRank ?? 0) + 1;

    if (nextRank >= rankedIds.length) {
      await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, id));
      return apiOk({ status: "cancelled", message: "No more workers available" });
    }

    const nextWorkerId = rankedIds[nextRank];
    const pingExpiresAt = new Date(Date.now() + 90_000);
    await db.update(bookings).set({ workerId: nextWorkerId, currentRank: nextRank, pingExpiresAt, updatedAt: new Date() }).where(eq(bookings.id, id));
    return apiOk({ status: "cascaded", nextWorkerId, rank: nextRank });
  }

  // Accept — open 2-minute quote window
  const quoteExpiresAt = new Date(Date.now() + 120_000);
  await db.update(bookings).set({ status: "quoted", quoteExpiresAt, updatedAt: new Date() }).where(eq(bookings.id, id));
  return apiOk({ status: "quoted", quoteExpiresAt });
}, ["worker"]);
