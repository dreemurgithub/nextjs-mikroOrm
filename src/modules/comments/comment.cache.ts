import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getEm } from "@/src/db/orm";
import { postCacheTags } from "@/src/modules/posts/post.cache";
import { listCommentsByPost } from "./comment.queries";

/** Disk-backed, hourly-refreshed cache for comments; same lifecycle as src/modules/posts/post.cache.ts. */
export const commentCacheTags = {
  /** All comment pages of one post. */
  byPost: (postId: string) => `post:${postId}:comments`,
};

/** One page of a post's comments; postId + pagination are part of the cache key. */
export async function getCachedPostComments(postId: string, page = 1, pageSize = 100) {
  "use cache: disk";
  cacheLife("hourly");
  cacheTag(postCacheTags.all, commentCacheTags.byPost(postId));
  return listCommentsByPost(await getEm(), postId, { page, pageSize });
}
