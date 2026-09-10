import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, customers, workers, users } from "@/db/schema";
import { apiError, apiOk } from "@/lib/api-middleware";
import { desc, eq, inArray, aliasedTable } from "drizzle-orm";

export const GET = async (req: NextRequest) => {
  // In a real app, we'd verify admin role here. For the prototype demo safety net, we leave this open.
  
  const customerUsers = aliasedTable(users, "customerUsers");
  const workerUsers = aliasedTable(users, "workerUsers");

  const allBookings = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      category: bookings.category,
      createdAt: bookings.createdAt,
      customerName: customerUsers.name,
      workerName: workerUsers.name,
      amount: bookings.quoteWage, // simplistic representation
    })
    .from(bookings)
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(customerUsers, eq(customers.userId, customerUsers.id))
    .leftJoin(workers, eq(bookings.workerId, workers.id))
    .leftJoin(workerUsers, eq(workers.userId, workerUsers.id))
    .where(inArray(bookings.status, ["paid", "in_progress", "accepted", "completed", "rated"]))
    .orderBy(desc(bookings.createdAt));

  return apiOk({ bookings: allBookings });
};
