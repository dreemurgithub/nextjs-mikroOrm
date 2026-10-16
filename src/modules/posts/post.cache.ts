import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getEm } from "@/src/db/orm";
import { findAllPosts, findPostById } from "./post.queries";

/**
 * Disk-backed cache for post read models (`"use cache: disk"`, handler in
 * cache-handlers/disk-cache-handler.js, files in $CACHE_CUSTOM_DIR or ./cache-custom).
 *
 * Unlike the user cache (in-memory, `cacheLife("max")`), these entries:
 * - survive restarts and can be shared by several instances through one volume,
 * - refresh on their own every hour (`cacheLife("hourly")`, see next.config.ts), which also
 *   catches writes the app never hears about (seeders, psql, author renames).
 *
 * Writes through the API still expire the tags below right away, so authors see their change.
 */
export const postCacheTags = {
  /** On every post and comment entry: expire everything (e.g. an author was renamed/deleted). */
  all: "posts:all",
  /** The `/posts` list (titles, authors, comment counts). */
  list: "posts",
  /** A single post. */
  detail: (id: string) => `post:${id}`,
};

export async function getCachedPosts() {
  "use cache: disk";
  cacheLife("hourly");
  cacheTag(postCacheTags.all, postCacheTags.list);
  return findAllPosts(await getEm());
}

/** `null` (unknown / soft-deleted id) is cached too, cleared by the same tag on restore. */
export async function getCachedPost(id: string) {
  "use cache: disk";
  cacheLife("hourly");
  cacheTag(postCacheTags.all, postCacheTags.detail(id));
  return findPostById(await getEm(), id);
}
