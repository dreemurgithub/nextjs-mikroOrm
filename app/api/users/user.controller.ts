import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { paginationSchema } from "@/src/lib/pagination";
import { SESSION_COOKIE } from "@/src/lib/session";
import { postCacheTags } from "@/src/modules/posts/post.cache";
import { userCacheTags } from "@/src/modules/users/user.cache";
import { updateUserSchema } from "@/src/modules/users/user.schemas";
import * as userService from "@/src/modules/users/user.service";

/**
 * Route handlers can't use `updateTag`, so expire the cached `/user` pages with
 * `revalidateTag(..., { expire: 0 })`: the next visit re-reads the DB instead of serving stale data.
 */
function expireUserCache(userId: string) {
  revalidateTag(userCacheTags.list, { expire: 0 });
  revalidateTag(userCacheTags.detail(userId), { expire: 0 });
  // Posts/comments show the author's name and are cascaded on delete: drop all of them.
  revalidateTag(postCacheTags.all, { expire: 0 });
}

export async function list(req: NextRequest, { em }: HandlerContext) {
  return Response.json(await userService.listUsers(em, parseQuery(req, paginationSchema)));
}

export async function get(_req: NextRequest, { em, params }: HandlerContext<{ id: string }>) {
  return Response.json(await userService.getUser(em, uuidParam.parse(params.id)));
}

export async function updateMe(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  const input = await parseJson(req, updateUserSchema);
  const user = await userService.updateProfile(em, me.id, input);
  expireUserCache(me.id);
  return Response.json(user);
}

/** Soft deletes the current account (and its posts/comments) and logs out. */
export async function deleteMe(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  await userService.deleteAccount(em, me.id);
  expireUserCache(me.id);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
