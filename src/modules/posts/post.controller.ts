import type { NextRequest } from "next/server";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from "./post.schemas";
import * as postService from "./post.service";

type IdParams = HandlerContext<{ id: string }>;

export async function list(req: NextRequest, { em }: HandlerContext) {
  return Response.json(await postService.listPosts(em, parseQuery(req, listPostsQuerySchema)));
}

/** The current user's soft-deleted posts, i.e. what can be restored. */
export async function listMyTrash(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  const query = parseQuery(req, listPostsQuerySchema.omit({ authorId: true }));
  return Response.json(await postService.listPosts(em, { ...query, authorId: me.id, deleted: "only" }));
}

export async function get(_req: NextRequest, { em, params }: IdParams) {
  return Response.json(await postService.getPost(em, uuidParam.parse(params.id)));
}

export async function create(req: NextRequest, { em }: HandlerContext) {
  const me = await requireAuth(req, em);
  const input = await parseJson(req, createPostSchema);
  return Response.json(await postService.createPost(em, me, input), { status: 201 });
}

export async function update(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const input = await parseJson(req, updatePostSchema);
  return Response.json(await postService.updatePost(em, me, uuidParam.parse(params.id), input));
}

export async function remove(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  await postService.deletePost(em, me, uuidParam.parse(params.id));
  return new Response(null, { status: 204 });
}

export async function restore(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  return Response.json(await postService.restorePost(em, me, uuidParam.parse(params.id)));
}
