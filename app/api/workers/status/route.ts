import { NextRequest } from "next/server";
import { db } from "@/db";
import { workers, bookings, customers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, and, sql, gt } from "drizzle-orm";

export const PUT = withAuth(async (req, jwtUser) => {
  const body = await req.json();
  const { isOnline } = body;

  if (typeof isOnline !== "boolean") {
    return apiError("Invalid isOnline value", 400);
  }

  // Find worker
  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker not found", 404);

  // Update worker status
  await db
    .update(workers)
    .set({ isOnline })
    .where(eq(workers.id, worker.id));

  // If going online, create a fake job for demo ping
  if (isOnline) {
    const pendingCount = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(eq(bookings.workerId, worker.id), eq(bookings.status, 'matched'), gt(bookings.pingExpiresAt, sql`NOW()`)));
      
    if (Number(pendingCount[0].count) === 0) {
      const [firstCustomer] = await db.select().from(customers).limit(1);
      if (firstCustomer) {
        await db.insert(bookings).values({
          customerId: firstCustomer.id,
          category: worker.category,
          description: "Fake job for demo ping",
          status: "matched",
          workerId: worker.id,
          pingExpiresAt: new Date(Date.now() + 90000), // 90s ping
          customerLat: worker.locationLat,
          customerLng: worker.locationLng,
        });
      }
    }
  }

  return apiOk({ success: true, message: "Status updated" });
}, ["worker"]);
