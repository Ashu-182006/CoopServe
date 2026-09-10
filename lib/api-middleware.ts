import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromHeader, JWTPayload } from "@/lib/jwt";

type RouteHandler = (
  req: NextRequest,
  user: JWTPayload,
  context?: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication.
 * Optionally restricts to specific roles.
 */
export function withAuth(
  handler: RouteHandler,
  allowedRoles?: Array<"customer" | "worker" | "admin">,
) {
  return async (
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    const token = getTokenFromHeader(req.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, user, context);
  };
}

/** Helper to return a standard API error */
export function apiError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Helper to return a standard API success */
export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
