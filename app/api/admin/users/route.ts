import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { apiOk } from "@/lib/api-middleware";
import { desc, inArray } from "drizzle-orm";

export const GET = async (req: NextRequest) => {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      mobile: users.mobile,
      role: users.role,
      isBlocked: users.isBlocked,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, ["customer", "worker"]))
    .orderBy(desc(users.createdAt));

  return apiOk({ users: allUsers });
};
