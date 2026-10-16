import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseJson, parseQuery, uuidParam, type HandlerContext } from "@/src/lib/http";
import { requireAuth } from "@/src/modules/auth/auth.guard";
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from "@/src/modules/posts/post.schemas";
import { postCacheTags } from "@/src/modules/posts/post.cache";
import * as postService from "@/src/modules/posts/post.service";

type IdParams = HandlerContext<{ id: string }>;

/** Expire the disk-cached `/posts` list (+ the post itself) so the next visit re-reads the DB. */
function expirePostCache(postId?: string) {
  revalidateTag(postCacheTags.list, { expire: 0 });
  if (postId) revalidateTag(postCacheTags.detail(postId), { expire: 0 });
}

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
  const post = await postService.createPost(em, me, input);
  expirePostCache();
  return Response.json(post, { status: 201 });
}

export async function update(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const input = await parseJson(req, updatePostSchema);
  const post = await postService.updatePost(em, me, uuidParam.parse(params.id), input);
  expirePostCache(post.id);
  return Response.json(post);
}

export async function remove(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const id = uuidParam.parse(params.id);
  await postService.deletePost(em, me, id);
  expirePostCache(id);
  return new Response(null, { status: 204 });
}

export async function restore(req: NextRequest, { em, params }: IdParams) {
  const me = await requireAuth(req, em);
  const post = await postService.restorePost(em, me, uuidParam.parse(params.id));
  expirePostCache(post.id);
  return Response.json(post);
}
