import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { apiError, apiOk } from "@/lib/api-middleware";
import { eq } from "drizzle-orm";

export const POST = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!id) return apiError("Missing user ID", 400);

  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) return apiError("User not found", 404);

  const newStatus = !user.isBlocked;
  await db.update(users).set({ isBlocked: newStatus }).where(eq(users.id, id));

  return apiOk({ success: true, isBlocked: newStatus });
};
