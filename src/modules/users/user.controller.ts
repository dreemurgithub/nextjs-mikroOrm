import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { paginationSchema } from "@/src/lib/pagination";
import { SESSION_COOKIE } from "@/src/lib/session";
import { updateUserSchema } from "./user.schemas";
import * as userService from "./user.service";

export async function list(req: NextRequest, { em }: HandlerContext) {
  return Response.json(await userService.listUsers(em, parseQuery(req, paginationSchema)));
}

export async function get(_req: NextRequest, { em, params }: HandlerContext<{ id: string }>) {
  return Response.json(await userService.getUser(em, uuidParam.parse(params.id)));
}

export async function updateMe(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  const input = await parseJson(req, updateUserSchema);
  return Response.json(await userService.updateProfile(em, me.id, input));
}

/** Soft deletes the current account (and its posts/comments) and logs out. */
export async function deleteMe(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  await userService.deleteAccount(em, me.id);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
