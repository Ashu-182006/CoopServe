import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, workers, customers, users } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, and, gt, sql } from "drizzle-orm";

// GET /api/workers/pending-jobs
export const GET = withAuth(async (req, jwtUser) => {

  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker profile not found", 404);

  // Lazy cascade check: If any booking assigned to us is matched and expired, we should reject it.
  // Actually, let's just fetch the ones that are valid:
  const pendingJobs = await db
    .select({
      id: bookings.id,
      category: bookings.category,
      description: bookings.description,
      beforeImageUrl: bookings.beforeImageUrl,
      pingExpiresAt: bookings.pingExpiresAt,
      customerName: users.name,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(users, eq(customers.userId, users.id))
    .where(
      and(
        eq(bookings.workerId, worker.id),
        eq(bookings.status, "matched"),
        gt(bookings.pingExpiresAt, sql`NOW()`)
      )
    );

  return apiOk(pendingJobs);
}, ["worker"]);
