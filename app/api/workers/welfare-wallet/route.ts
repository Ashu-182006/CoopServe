import { NextRequest } from "next/server";
import { db } from "@/db";
import { workers, welfareWallet } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const GET = withAuth(async (req, jwtUser) => {
  const [worker] = await db.select().from(workers).where(eq(workers.userId, jwtUser.sub));
  if (!worker) return apiError("Worker not found", 404);

  const [wallet] = await db.select().from(welfareWallet).where(eq(welfareWallet.workerId, worker.id));
  
  // Return the wallet or default values if none exist yet
  return apiOk({
    wallet: wallet || {
      pmsbyEnrolled: false,
      pmsbyPolicyYear: "N/A",
      contributionsTotal: 0,
      surplusBalance: 0,
    }
  });
}, ["worker"]);
