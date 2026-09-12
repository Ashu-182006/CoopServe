import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  real,
  pgEnum,
  uuid,
  serial,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["customer", "worker", "admin"]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "matched",
  "quoted",
  "accepted",
  "paid",
  "in_progress",
  "completed",
  "rated",
  "cancelled",
]);

export const escrowStatusEnum = pgEnum("escrow_status", [
  "pending",
  "held",
  "released",
  "refunded",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "pending",
  "processed",
  "failed",
]);

export const certTierEnum = pgEnum("cert_tier", ["none", "basic", "pmkvy"]);

export const langPrefEnum = pgEnum("lang_pref", ["en", "hi"]);

// ─── users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  name:          varchar("name", { length: 120 }).notNull(),
  mobile:        varchar("mobile", { length: 15 }).notNull(),
  dob:           varchar("dob", { length: 10 }),          // YYYY-MM-DD string (prototype)
  passwordHash:  text("password_hash").notNull(),
  role:          userRoleEnum("role").notNull().default("customer"),
  langPref:      langPrefEnum("lang_pref").notNull().default("en"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
  isBlocked:     boolean("is_blocked").notNull().default(false),
}, (t) => ({
  unq_mobile_role: unique("unq_mobile_role").on(t.mobile, t.role),
}));

// ─── customers ───────────────────────────────────────────────────────────────
export const customers = pgTable("customers", {
  id:            uuid("id").primaryKey().defaultRandom(),
  userId:        uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  address:       text("address"),
  bankDetails:   text("bank_details"),                    // stored as stringified JSON (prototype)
  aadhaarToken:  varchar("aadhaar_token", { length: 64 }), // mock — stores "verified" flag
  panToken:      varchar("pan_token", { length: 32 }),
});

// ─── workers ─────────────────────────────────────────────────────────────────
export const workers = pgTable("workers", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  userId:              uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category:            varchar("category", { length: 60 }).notNull(),
  address:             text("address"),
  bankDetails:         text("bank_details"),
  aadhaarToken:        varchar("aadhaar_token", { length: 64 }),
  panToken:            varchar("pan_token", { length: 32 }),
  certificationStatus: boolean("certification_status").notNull().default(false),
  certificationTier:   certTierEnum("certification_tier").notNull().default("none"),
  certJoinedAt:        timestamp("cert_joined_at"),       // used for 90-day penalty window
  isOnline:            boolean("is_online").notNull().default(false),
  // PostGIS geography(Point, 4326) stored as raw column
  location:            text("location"),                  // will be updated via raw SQL
  locationLat:         real("location_lat"),              // mirror for easy JS reads
  locationLng:         real("location_lng"),
  lastJobCompletedAt:  timestamp("last_job_completed_at"),
  photoUrl:            text("photo_url"),
  passportId:          varchar("passport_id", { length: 20 }).unique(), // CS-WK-XXXXXX
  createdAt:           timestamp("created_at").notNull().defaultNow(),
});

// ─── bookings ────────────────────────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id:             uuid("id").primaryKey().defaultRandom(),
  customerId:     uuid("customer_id").notNull().references(() => customers.id),
  workerId:       uuid("worker_id").references(() => workers.id),
  category:       varchar("category", { length: 60 }).notNull(),
  description:    text("description").notNull(),
  customerLat:    real("customer_lat"),
  customerLng:    real("customer_lng"),
  beforeImageUrl: text("before_image_url"),
  afterImageUrl:  text("after_image_url"),
  status:         bookingStatusEnum("status").notNull().default("pending"),
  quoteWage:      integer("quote_wage"),                  // in paise (INR * 100)
  quotePartsCost: integer("quote_parts_cost"),            // in paise
  otp:            varchar("otp", { length: 8 }),
  // ranked workers list stored as JSON array of worker IDs
  rankedWorkers:  text("ranked_workers"),
  currentRank:    integer("current_rank").notNull().default(0),
  pingExpiresAt:  timestamp("ping_expires_at"),           // 30s window
  quoteExpiresAt: timestamp("quote_expires_at"),          // 2-min window
  completedAt:    timestamp("completed_at"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
});

// ─── payments ────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id:               uuid("id").primaryKey().defaultRandom(),
  bookingId:        uuid("booking_id").notNull().references(() => bookings.id),
  amount:           integer("amount").notNull(),           // in paise
  escrowStatus:     escrowStatusEnum("escrow_status").notNull().default("pending"),
  platformFee:      integer("platform_fee"),               // 2.5% in paise
  welfareFee:       integer("welfare_fee"),                // 2.5% in paise
  workerPayout:     integer("worker_payout"),              // 95% in paise
  payoutStatus:     payoutStatusEnum("payout_status").notNull().default("pending"),
  razorpayOrderId:  varchar("razorpay_order_id", { length: 60 }),
  razorpayPaymentId:varchar("razorpay_payment_id", { length: 60 }),
  razorpaySignature:text("razorpay_signature"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

// ─── ratings ─────────────────────────────────────────────────────────────────
export const ratings = pgTable("ratings", {
  id:           uuid("id").primaryKey().defaultRandom(),
  bookingId:    uuid("booking_id").notNull().references(() => bookings.id),
  customerId:   uuid("customer_id").notNull().references(() => customers.id),
  workerId:     uuid("worker_id").notNull().references(() => workers.id),
  score:        integer("score").notNull(),                // 1–5
  feedbackText: text("feedback_text"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ─── worker_rating_stats ──────────────────────────────────────────────────────
export const workerRatingStats = pgTable("worker_rating_stats", {
  workerId:    uuid("worker_id").primaryKey().references(() => workers.id, { onDelete: "cascade" }),
  nReviews:    integer("n_reviews").notNull().default(0),
  simpleAvg:   real("simple_avg").notNull().default(0),
  bayesianAvg: real("bayesian_avg").notNull().default(0),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

// ─── welfare_wallet ───────────────────────────────────────────────────────────
export const welfareWallet = pgTable("welfare_wallet", {
  workerId:           uuid("worker_id").primaryKey().references(() => workers.id, { onDelete: "cascade" }),
  pmsbyEnrolled:      boolean("pmsby_enrolled").notNull().default(false),
  pmsbyPolicyYear:    varchar("pmsby_policy_year", { length: 9 }),  // e.g. "2025-2026"
  contributionsTotal: integer("contributions_total").notNull().default(0), // in paise
  surplusBalance:     integer("surplus_balance").notNull().default(0),     // in paise
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

// ─── Type exports (inferred from schema) ─────────────────────────────────────
export type User            = typeof users.$inferSelect;
export type NewUser         = typeof users.$inferInsert;
export type Customer        = typeof customers.$inferSelect;
export type NewCustomer     = typeof customers.$inferInsert;
export type Worker          = typeof workers.$inferSelect;
export type NewWorker       = typeof workers.$inferInsert;
export type Booking         = typeof bookings.$inferSelect;
export type NewBooking      = typeof bookings.$inferInsert;
export type Payment         = typeof payments.$inferSelect;
export type NewPayment      = typeof payments.$inferInsert;
export type Rating          = typeof ratings.$inferSelect;
export type NewRating       = typeof ratings.$inferInsert;
export type WorkerRatingStat= typeof workerRatingStats.$inferSelect;
export type WelfareWallet   = typeof welfareWallet.$inferSelect;
