import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./db/index";
import { bookings } from "./db/schema";
import { desc } from "drizzle-orm";

async function run() {
  const latestBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(1);
  console.log("Latest booking:", latestBookings[0]);
  process.exit(0);
}
run();
