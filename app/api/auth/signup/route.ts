import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, customers, workers, workerRatingStats, welfareWallet } from "@/db/schema";
import { signToken } from "@/lib/jwt";
import { mockVerifyAadhaar, mockVerifyPan } from "@/lib/mock-verify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const customerSchema = z.object({
  name:        z.string().min(2),
  mobile:      z.string().regex(/^\d{10}$/),
  dob:         z.string().optional(),
  aadhaar:     z.string().regex(/^\d{12}$/, "Invalid Aadhaar format"),
  pan:         z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  password:    z.string().min(8),
  address:     z.string().optional(),
  bankDetails: z.string().optional(),
  role:        z.literal("customer"),
});

const workerSchema = z.object({
  name:        z.string().min(2),
  mobile:      z.string().regex(/^\d{10}$/),
  address:     z.string().optional(),
  dob:         z.string().optional(),
  aadhaar:     z.string().regex(/^\d{12}$/, "Invalid Aadhaar format"),
  pan:         z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  password:    z.string().min(8),
  category:    z.string().min(2),
  bankDetails: z.string().optional(),
  certified:   z.boolean().optional(),
  photoUrl:    z.string().optional(),
  role:        z.literal("worker"),
});

const signupSchema = z.discriminatedUnion("role", [customerSchema, workerSchema]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      console.log("Signup validation failed:", parsed.error.flatten());
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(", ")}`)
        .join(" | ");
      return NextResponse.json(
        { error: `Validation failed: ${errorMsg}`, details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Age validation for workers
    if (data.role === "worker") {
      if (!data.dob) {
        return NextResponse.json({ error: "Date of birth is required for workers" }, { status: 400 });
      }
      const birthDate = new Date(data.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return NextResponse.json({ error: "Worker must be 18 years or older" }, { status: 400 });
      }
    }

    // Check mobile not already taken
    const existing = await db.select({ id: users.id }).from(users).where(
      and(eq(users.mobile, data.mobile), eq(users.role, data.role))
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "Mobile number already registered" }, { status: 409 });
    }

    // Verify Aadhaar & PAN
    const aadhaarResult = await mockVerifyAadhaar(data.aadhaar);
    if (!aadhaarResult.verified) return NextResponse.json({ error: "Aadhaar verification failed" }, { status: 400 });

    const panResult = await mockVerifyPan(data.pan);
    if (!panResult.verified) return NextResponse.json({ error: "PAN verification failed" }, { status: 400 });

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const [user] = await db.insert(users).values({
      name:         data.name,
      mobile:       data.mobile,
      dob:          data.dob,
      passwordHash,
      role:         data.role,
    }).returning();

    if (data.role === "customer") {
      await db.insert(customers).values({
        userId:       user.id,
        address:      data.address,
        aadhaarToken: aadhaarResult.token,
        panToken:     panResult.token,
        bankDetails:  data.bankDetails,
      });
    } else {
      // Generate passport ID
      const workerCount = await db.select({ id: users.id }).from(users).where(eq(users.role, "worker"));
      const passportId = `CS-WK-${String(workerCount.length).padStart(6, "0")}`;

      const [worker] = await db.insert(workers).values({
        userId:              user.id,
        category:            data.category,
        address:             data.address,
        aadhaarToken:        aadhaarResult.token,
        panToken:            panResult.token,
        bankDetails:         data.bankDetails,
        certificationStatus: data.certified ?? false,
        certificationTier:   data.certified ? "basic" : "none",
        certJoinedAt:        data.certified ? new Date() : null,
        passportId,
        photoUrl:            data.photoUrl,
      }).returning();

      // Initialise rating stats
      await db.insert(workerRatingStats).values({ workerId: worker.id });

      // Initialise welfare wallet
      await db.insert(welfareWallet).values({
        workerId:    worker.id,
        pmsbyEnrolled: false,
        contributionsTotal: 0,
        surplusBalance:     0,
      });
    }

    const token = await signToken({
      sub:    user.id,
      role:   user.role as "customer" | "worker" | "admin",
      mobile: user.mobile,
      name:   user.name,
    });

    return NextResponse.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, address: data.address } }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
