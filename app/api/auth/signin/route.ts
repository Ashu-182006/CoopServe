import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users, customers, workers } from "@/db/schema";
import { signToken } from "@/lib/jwt";
import { z } from "zod";
import { eq } from "drizzle-orm";

const signinSchema = z.object({
  mobile:   z.string().regex(/^\d{10}$/),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { mobile, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.mobile, mobile));
    if (!user) {
      return NextResponse.json({ error: "Invalid mobile or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid mobile or password" }, { status: 401 });
    }

    const token = await signToken({
      sub:    user.id,
      role:   user.role as "customer" | "worker" | "admin",
      mobile: user.mobile,
      name:   user.name,
    });

    let address = "";
    if (user.role === "customer") {
      const [c] = await db.select({ address: customers.address }).from(customers).where(eq(customers.userId, user.id));
      if (c && c.address) address = c.address;
    } else if (user.role === "worker") {
      const [w] = await db.select({ address: workers.address }).from(workers).where(eq(workers.userId, user.id));
      if (w && w.address) address = w.address;
    }

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, address },
    });
  } catch (err) {
    console.error("[signin]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
