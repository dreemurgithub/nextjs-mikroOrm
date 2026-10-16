import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { paginationSchema } from "@/src/lib/pagination";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { createCommentSchema, updateCommentSchema } from "@/src/modules/comments/comment.schemas";
import { commentCacheTags } from "@/src/modules/comments/comment.cache";
import * as commentService from "@/src/modules/comments/comment.service";
import { postCacheTags } from "@/src/modules/posts/post.cache";

type IdParams = HandlerContext<{ id: string }>;

/** Expire the post's disk-cached comments, plus the post and list (they show comment counts). */
function expireCommentCache(postId: string) {
  revalidateTag(commentCacheTags.byPost(postId), { expire: 0 });
  revalidateTag(postCacheTags.detail(postId), { expire: 0 });
  revalidateTag(postCacheTags.list, { expire: 0 });
}

/** GET /api/posts/:id/comments */
export async function listForPost(req: NextRequest, { em, params }: IdParams) {
  const postId = uuidParam.parse(params.id);
  return Response.json(await commentService.listPostComments(em, postId, parseQuery(req, paginationSchema)));
}

/** POST /api/posts/:id/comments */
export async function createForPost(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const { content } = await parseJson(req, createCommentSchema);
  const comment = await commentService.createComment(em, me, uuidParam.parse(params.id), content);
  expireCommentCache(comment.postId);
  return Response.json(comment, { status: 201 });
}

export async function get(_req: NextRequest, { em, params }: IdParams) {
  return Response.json(await commentService.getComment(em, uuidParam.parse(params.id)));
}

export async function update(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const { content } = await parseJson(req, updateCommentSchema);
  const comment = await commentService.updateComment(em, me, uuidParam.parse(params.id), content);
  expireCommentCache(comment.postId);
  return Response.json(comment);
}

export async function remove(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const { postId } = await commentService.deleteComment(em, me, uuidParam.parse(params.id));
  expireCommentCache(postId);
  return new Response(null, { status: 204 });
}

export async function restore(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const comment = await commentService.restoreComment(em, me, uuidParam.parse(params.id));
  expireCommentCache(comment.postId);
  return Response.json(comment);
}
