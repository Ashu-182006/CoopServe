import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const createAdminSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().regex(/^\d{10}$/),
  password: z.string().min(8),
});

export const POST = withAuth(async (req, jwtUser) => {
  const body = await req.json();
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) return apiError("Validation failed", 400);

  const data = parsed.data;

  // Check mobile not already taken
  const existing = await db.select({ id: users.id }).from(users).where(
    and(eq(users.mobile, data.mobile), eq(users.role, "admin"))
  );
  if (existing.length > 0) {
    return apiError("Mobile number already registered as admin", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create admin
  await db.insert(users).values({
    name: data.name,
    mobile: data.mobile,
    passwordHash,
    role: "admin",
  });

  return apiOk({ success: true, message: "Admin created successfully" });
}, ["admin"]);
