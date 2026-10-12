import { NextResponse, type NextRequest } from "next/server";
import { parseJson, type HandlerContext } from "@/src/lib/http";
import { SESSION_COOKIE, sessionCookie } from "@/src/lib/session";
import { requireAuth } from "./auth.guard";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authService from "./auth.service";

/** Sets the httpOnly session cookie and also returns the token for non-browser clients (Bearer). */
function withSession(body: { user: unknown; token: string }, status = 200) {
  const res = NextResponse.json(body, { status });
  res.cookies.set(sessionCookie(body.token));
  return res;
}

export async function register(req: NextRequest, { em }: HandlerContext) {
  const input = await parseJson(req, registerSchema);
  return withSession(await authService.register(em, input), 201);
}

export async function login(req: NextRequest, { em }: HandlerContext) {
  const input = await parseJson(req, loginSchema);
  return withSession(await authService.login(em, input));
}

export async function logout() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function me(req: NextRequest, { em }: HandlerContext) {
  return Response.json(await requireAuth(req, em));
}
