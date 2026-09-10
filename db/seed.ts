import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Database seed script — run with:
 *   npx tsx db/seed.ts
 *
 * Seeds: 1 admin, 2 customers, 12 workers (varied location, rating, idle time)
 * for a convincing Fair Rotation demo in front of judges.
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { computeBayesianAvg } from "../lib/bayesian-rating";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

// ── helpers ──────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10);
const inPaise = (rupees: number) => Math.round(rupees * 100);

// Bengaluru centre: 12.9716° N, 77.5946° E
const CENTRE = { lat: 12.9716, lng: 77.5946 };
function offsetLatLng(km: number, bearing: number) {
  const earthRadius = 6371;
  const lat = CENTRE.lat + (km / earthRadius) * (180 / Math.PI) * Math.sin((bearing * Math.PI) / 180);
  const lng = CENTRE.lng + (km / earthRadius) * (180 / Math.PI) / Math.cos((CENTRE.lat * Math.PI) / 180) * Math.cos((bearing * Math.PI) / 180);
  return { lat: parseFloat(lat.toFixed(5)), lng: parseFloat(lng.toFixed(5)) };
}

async function seed() {
  console.log("🌱 Seeding CoopServe database...\n");

  console.log("🧹 Cleaning old data...");
  await db.delete(schema.payments);
  await db.delete(schema.bookings);
  await db.delete(schema.welfareWallet);
  await db.delete(schema.workerRatingStats);
  await db.delete(schema.workers);
  await db.delete(schema.customers);
  await db.delete(schema.users);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const [admin] = await db.insert(schema.users).values({
    name: "CS Admin",
    mobile: "9000000000",
    passwordHash: await hash("Admin@123"),
    role: "admin",
  }).returning();
  console.log("✅ Admin created:", admin.mobile);

  // ── Customers ─────────────────────────────────────────────────────────────
  const customerData = [
    { name: "Priya Sharma",   mobile: "9100000001" },
    { name: "Rajesh Kumar",   mobile: "9100000002" },
    { name: "Ananya Menon",   mobile: "9100000003" },
  ];

  for (const c of customerData) {
    const [u] = await db.insert(schema.users).values({
      name: c.name, mobile: c.mobile,
      passwordHash: await hash("Test@1234"),
      role: "customer",
    }).returning();
    await db.insert(schema.customers).values({
      userId: u.id,
      address: "MG Road, Bengaluru, Karnataka 560001",
      aadhaarToken: "MOCK_AADHAAR_VERIFIED",
      panToken: "MOCK_PAN_VERIFIED",
    });
    console.log("✅ Customer:", c.name, c.mobile);
  }

  // ── Workers — varied data for algorithm demo ───────────────────────────────
  const PLATFORM_AVG = 3.9; // approximate — used for initial Bayesian calc

  const workerData = [
    // name, mobile, category, distKm, bearing, nReviews, simpleAvg, certStatus, hoursSinceJob
    { name: "Arvind Patel",     mobile: "9200000001", category: "Plumbing",   dist: 1.2, bear: 45,  n: 42, avg: 4.7, cert: true,  hoursIdle: 0.5 },
    { name: "Sunita Rao",       mobile: "9200000002", category: "Plumbing",   dist: 2.8, bear: 135, n: 28, avg: 4.2, cert: true,  hoursIdle: 3.2 },
    { name: "Mohammed Salim",   mobile: "9200000003", category: "Plumbing",   dist: 4.1, bear: 225, n: 6,  avg: 3.8, cert: false, hoursIdle: 1.1 },
    { name: "Lakshmi Devi",     mobile: "9200000004", category: "Carpentry",  dist: 0.9, bear: 310, n: 55, avg: 4.9, cert: true,  hoursIdle: 0.2 },
    { name: "Deepak Singh",     mobile: "9200000005", category: "Carpentry",  dist: 3.5, bear: 80,  n: 12, avg: 4.1, cert: false, hoursIdle: 5.0 },
    { name: "Kavitha Nair",     mobile: "9200000006", category: "Cleaning",   dist: 1.8, bear: 190, n: 31, avg: 4.5, cert: true,  hoursIdle: 2.0 },
    { name: "Ramesh Verma",     mobile: "9200000007", category: "Cleaning",   dist: 5.3, bear: 260, n: 8,  avg: 3.5, cert: false, hoursIdle: 4.5 },
    { name: "Pooja Iyer",       mobile: "9200000008", category: "Electrical", dist: 2.2, bear: 20,  n: 20, avg: 4.3, cert: true,  hoursIdle: 1.5 },
    { name: "Suresh Babu",      mobile: "9200000009", category: "Electrical", dist: 6.7, bear: 150, n: 3,  avg: 3.0, cert: false, hoursIdle: 8.0 },
    { name: "Nalini Krishnan",  mobile: "9200000010", category: "Painting",   dist: 3.0, bear: 330, n: 18, avg: 4.4, cert: true,  hoursIdle: 2.8 },
    { name: "Vikram Desai",     mobile: "9200000011", category: "Painting",   dist: 7.5, bear: 95,  n: 0,  avg: 0,   cert: false, hoursIdle: 12.0 },
    { name: "Geeta Sharma",     mobile: "9200000012", category: "Appliance Repair", dist: 1.5, bear: 270, n: 36, avg: 4.6, cert: true, hoursIdle: 1.0 },
  ];

  let workerIndex = 1;
  for (const w of workerData) {
    const [u] = await db.insert(schema.users).values({
      name: w.name, mobile: w.mobile,
      passwordHash: await hash("Test@1234"),
      role: "worker",
    }).returning();

    const loc = offsetLatLng(w.dist, w.bear);
    const lastJob = new Date(Date.now() - w.hoursIdle * 3600 * 1000);
    const passportId = `CS-WK-${String(workerIndex).padStart(6, "0")}`;
    workerIndex++;

    const certJoinedAt = w.cert
      ? new Date(Date.now() - 180 * 24 * 3600 * 1000)  // 6 months ago
      : new Date(Date.now() - 30  * 24 * 3600 * 1000); // 30 days ago (within 90-day window)

    const [worker] = await db.insert(schema.workers).values({
      userId: u.id,
      category: w.category,
      certificationStatus: w.cert,
      certificationTier: w.cert ? "pmkvy" : "none",
      certJoinedAt,
      isOnline: true,
      locationLat: loc.lat,
      locationLng: loc.lng,
      lastJobCompletedAt: lastJob,
      passportId,
      aadhaarToken: "MOCK_AADHAAR_VERIFIED",
      panToken: "MOCK_PAN_VERIFIED",
    }).returning();

    // Rating stats
    const bayesian = w.n > 0
      ? computeBayesianAvg(w.n, w.avg, PLATFORM_AVG)
      : PLATFORM_AVG;

    await db.insert(schema.workerRatingStats).values({
      workerId: worker.id,
      nReviews: w.n,
      simpleAvg: w.avg,
      bayesianAvg: bayesian,
    });

    // Welfare wallet
    await db.insert(schema.welfareWallet).values({
      workerId: worker.id,
      pmsbyEnrolled: w.cert,
      pmsbyPolicyYear: "2025-2026",
      contributionsTotal: inPaise(w.n * 45),    // ≈ ₹45 per job * reviews
      surplusBalance: inPaise(w.n * 12),         // illustrative
    });

    console.log(`✅ Worker [${passportId}] ${w.name} | ${w.category} | ${w.dist}km | Rating: ${bayesian.toFixed(2)} | Idle: ${w.hoursIdle}h`);
  }

  console.log("\n🎉 Seed complete! Database is ready for the demo.\n");
  console.log("Demo credentials:");
  console.log("  Admin:    9000000000 / Admin@123");
  console.log("  Customer: 9100000001 / Test@1234");
  console.log("  Worker:   9200000001 / Test@1234");
  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
