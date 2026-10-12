import type { NextRequest } from "next/server";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { paginationSchema } from "@/src/lib/pagination";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { createCommentSchema, updateCommentSchema } from "@/src/modules/comments/comment.schemas";
import * as commentService from "@/src/modules/comments/comment.service";

type IdParams = HandlerContext<{ id: string }>;

/** GET /api/posts/:id/comments */
export async function listForPost(req: NextRequest, { em, params }: IdParams) {
  const postId = uuidParam.parse(params.id);
  return Response.json(await commentService.listPostComments(em, postId, parseQuery(req, paginationSchema)));
}

/** POST /api/posts/:id/comments */
export async function createForPost(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const { content } = await parseJson(req, createCommentSchema);
  return Response.json(await commentService.createComment(em, me, uuidParam.parse(params.id), content), {
    status: 201,
  });
}

export async function get(_req: NextRequest, { em, params }: IdParams) {
  return Response.json(await commentService.getComment(em, uuidParam.parse(params.id)));
}

export async function update(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const { content } = await parseJson(req, updateCommentSchema);
  return Response.json(await commentService.updateComment(em, me, uuidParam.parse(params.id), content));
}

export async function remove(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  await commentService.deleteComment(em, me, uuidParam.parse(params.id));
  return new Response(null, { status: 204 });
}

export async function restore(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  return Response.json(await commentService.restoreComment(em, me, uuidParam.parse(params.id)));
}
