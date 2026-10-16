import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { parseJson, type HandlerContext } from "@/src/lib/http";
import { SESSION_COOKIE, sessionCookie } from "@/src/lib/session";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { loginSchema, registerSchema } from "@/src/modules/auth/auth.schemas";
import * as authService from "@/src/modules/auth/auth.service";
import { userCacheTags } from "@/src/modules/users/user.cache";

/** Sets the httpOnly session cookie and also returns the token for non-browser clients (Bearer). */
function withSession(body: { user: unknown; token: string }, status = 200) {
  const res = NextResponse.json(body, { status });
  res.cookies.set(sessionCookie(body.token));
  return res;
}

export async function register(req: NextRequest, { em }: HandlerContext) {
  const input = await parseJson(req, registerSchema);
  const result = await authService.register(em, input);
  // The prerendered `/user` list is tagged "users". Expiring the tag doesn't re-render anything
  // now; the next `/user` request sees the expired tag, re-renders, re-reads the DB (so the new
  // user appears) and caches the result again. `{ expire: 0 }` makes that request wait for fresh
  // data instead of serving the old list (`updateTag` would do the same, but is server-action only).
  // The new user's detail page has no cache entry yet, so there is nothing to expire for it.
  // Full lifecycle: see src/modules/users/user.cache.ts.
  revalidateTag(userCacheTags.list, { expire: 0 });
  return withSession(result, 201);
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
