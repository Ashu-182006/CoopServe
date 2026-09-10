import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, customers, users } from "@/db/schema";
import { withAuth, apiError, apiOk } from "@/lib/api-middleware";
import { eq, desc } from "drizzle-orm";

// GET /api/customer/bookings — list customer's bookings
export const GET = withAuth(async (_req, jwtUser) => {
  const [customer] = await db.select().from(customers).where(eq(customers.userId, jwtUser.sub));
  if (!customer) return apiError("Customer profile not found", 404);

  const list = await db.select().from(bookings)
    .where(eq(bookings.customerId, customer.id))
    .orderBy(desc(bookings.createdAt))
    .limit(20);

  return apiOk(list);
}, ["customer"]);
