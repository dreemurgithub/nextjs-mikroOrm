import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getEm } from "@/src/db/orm";
import { findAllUsers, findUserById } from "./user.queries";

/**
 * Next.js data cache for user read models ("use cache").
 *
 * "Static" here does NOT mean "frozen until the next build". The build only fills the cache
 * the first time; the running server (`next start`) refreshes it whenever a tag is invalidated.
 *
 * Lifecycle, using the `/user` list as the example:
 *
 * 1. `next build`: `/user` is prerendered once. `getCachedUsers()` reads the DB, and Next stores
 *    both the result and the page HTML. Both are labelled with the `users` tag, because
 *    `cacheTag()` runs inside the cached function and the page rendered from it inherits the tag.
 *
 * 2. Normal request: the server sends the stored HTML as is. No render, no DB query.
 *
 * 3. A write (e.g. register): `revalidateTag("users", { expire: 0 })` / `updateTag("users")` runs
 *    in the server process and marks every entry labelled `users` as expired, including the
 *    `/user` HTML. Nothing is re-rendered at this point; the entries are only marked.
 *
 * 4. Next request to `/user`: the server sees the stored page carries an expired tag, renders it
 *    again, `getCachedUsers()` reads the DB again (so the new user is there), and the new result +
 *    HTML replace the old ones. Every later request is served from the cache again → back to 2.
 *
 * Invalidation flavours:
 * - `updateTag(tag)` (server actions only) and `revalidateTag(tag, { expire: 0 })` (route handlers):
 *   the first request after the write waits for the fresh render, so it already shows the change.
 * - `revalidateTag(tag, "max")`: stale-while-revalidate. The first request after the write still
 *   gets the OLD page while the new one renders in the background; the request after it sees the
 *   change. Cheaper, but not read-your-own-writes, so it is not used here.
 *
 * `cacheLife("max")`: no time-based refresh worth relying on (the build output shows
 * `Revalidate 30d / Expire 1y` as a backstop), so entries effectively change only when a tag is
 * invalidated. EVERY user mutation must therefore invalidate the tags below, otherwise the pages
 * keep showing stale data.
 *
 * Limits:
 * - Writes made outside the app (seeders, psql) never call `revalidateTag`, so the cache never
 *   hears about them. Invalidate the tag or rebuild to pick them up.
 * - The cache and the tag state live in the memory of one server process by default. With several
 *   instances, configure a shared cache handler (`cacheHandlers` in next.config, e.g. Redis);
 *   otherwise a register on instance A only expires A's cache.
 * - On a restart the cache is seeded again from the prerendered build output, which may be older
 *   than the DB, so pages invalidated since the last build show build-time data again until the
 *   next invalidation.
 */
export const userCacheTags = {
  /** The `/user` list: anything that adds, removes or renames a user. */
  list: "users",
  /** A single `/user/[id]` page. */
  detail: (id: string) => `user:${id}`,
};

/** Cached `findAllUsers`. Returns plain `UserView`s (Dates included), which the cache can serialize. */
export async function getCachedUsers() {
  "use cache";
  cacheLife("max");
  cacheTag(userCacheTags.list);
  return findAllUsers(await getEm());
}

/** Cached `findUserById`; the id argument is part of the cache key, so each user has its own entry. */
export async function getCachedUser(id: string) {
  "use cache";
  cacheLife("max");
  cacheTag(userCacheTags.detail(id));
  // A `null` (unknown / soft-deleted id) is cached too, and cleared by the same tag on restore.
  return findUserById(await getEm(), id);
}
