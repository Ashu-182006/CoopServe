import { NextRequest } from "next/server";
import { db } from "@/db";
import { workers } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, sql } from "drizzle-orm";

export const POST = withAuth(async (req, jwtUser) => {
  const body = await req.json();
  const { lat, lng, isOnline } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return apiError("Missing or invalid lat/lng", 400);
  }

  // Find worker
  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker not found", 404);

  const updateData: any = {
    locationLat: lat,
    locationLng: lng,
    location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
  };

  if (typeof isOnline === "boolean") {
    updateData.isOnline = isOnline;
  }

  // Update worker location
  await db
    .update(workers)
    .set(updateData)
    .where(eq(workers.id, worker.id));

  return apiOk({ success: true, message: "Location updated" });
}, ["worker"]);
