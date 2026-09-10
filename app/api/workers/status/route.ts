import { NextRequest } from "next/server";
import { db } from "@/db";
import { workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

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

  return apiOk({ success: true, message: "Status updated" });
}, ["worker"]);
