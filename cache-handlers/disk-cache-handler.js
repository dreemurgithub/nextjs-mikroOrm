// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports -- Next loads this file as plain CommonJS */
/**
 * Disk-backed cache handler for `"use cache: disk"` (registered in next.config.ts → `cacheHandlers.disk`).
 *
 * Why disk instead of the built-in in-memory LRU:
 * - entries survive a server restart / redeploy (mount the dir as a volume),
 * - several instances can share one volume, including tag invalidations (see `refreshTags`).
 *
 * Location: `$CACHE_CUSTOM_DIR`, or `<cwd>/cache-custom` when the env var is not set.
 *
 *   <dir>/entries/<sha256(cacheKey)>.json   one file per entry: metadata + base64 value
 *   <dir>/tags.json                         tag → { stale?, expired? } timestamps (ms)
 *
 * Timing is driven by the entry's cacheLife (the `hourly` profile in next.config.ts):
 * - past `revalidate` (1h): the entry is still served and Next regenerates it in the background
 *   (stale-while-revalidate), so the data refreshes about every hour.
 * - past `expire`: the entry is a miss and is regenerated before responding; the file is deleted.
 *
 * Every write is `write tmp file → rename`, which is atomic on one filesystem, so a reader never
 * sees a half-written entry.
 *
 * Plain CommonJS (no TS, no app imports): Next loads this file directly at runtime.
 */
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

/** @typedef {import("next/cache").CacheEntry} CacheEntry */
/** @typedef {import("next/cache").CacheHandler} CacheHandler */
/** @typedef {Omit<CacheEntry, "value"> & { value: string }} StoredEntry */
/** @typedef {{ stale?: number; expired?: number }} TagState */

const CACHE_DIR = path.resolve(process.env.CACHE_CUSTOM_DIR || path.join(process.cwd(), "cache-custom"));
const ENTRIES_DIR = path.join(CACHE_DIR, "entries");
const TAGS_FILE = path.join(CACHE_DIR, "tags.json");
/** How often `set` sweeps expired files off the disk (Next never deletes entries itself). */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

const debug = process.env.CACHE_CUSTOM_DEBUG ? console.debug.bind(console, "[disk-cache]") : () => {};

/** Local copy of tags.json, re-read by `refreshTags` when another process changed it. */
/** @type {Map<string, TagState>} */
let tags = new Map();
let tagsMtimeMs = 0;
/** In-flight `set`s, so a `get` for the same key waits instead of reporting a miss. */
/** @type {Map<string, Promise<void>>} */
const pendingSets = new Map();
let lastSweep = 0;

const now = () => Date.now();
const entryFile = (/** @type {string} */ key) =>
  path.join(ENTRIES_DIR, `${crypto.createHash("sha256").update(key).digest("hex")}.json`);

/** @param {string} file @param {string} data */
async function writeAtomic(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

/** @param {Uint8Array} bytes */
function streamFromBytes(bytes) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

/** Mirrors Next's built-in tags manifest: a tag expired after the entry was written → miss. */
function hasExpiredTag(/** @type {string[]} */ entryTags, /** @type {number} */ timestamp) {
  const t = now();
  return entryTags.some((tag) => {
    const expired = tags.get(tag)?.expired;
    return typeof expired === "number" && expired <= t && expired > timestamp;
  });
}

/** A tag marked stale after the entry was written → serve once more, regenerate in background. */
function hasStaleTag(/** @type {string[]} */ entryTags, /** @type {number} */ timestamp) {
  return entryTags.some((tag) => (tags.get(tag)?.stale ?? 0) > timestamp);
}

async function loadTags() {
  try {
    const stat = await fs.stat(TAGS_FILE);
    if (stat.mtimeMs === tagsMtimeMs) return;
    tags = new Map(Object.entries(JSON.parse(await fs.readFile(TAGS_FILE, "utf8"))));
    tagsMtimeMs = stat.mtimeMs;
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== "ENOENT") debug("loadTags failed", err);
  }
}

/** Deletes entry files whose `expire` has passed; temp files left by a crash go too. */
async function sweep() {
  lastSweep = now();
  let files;
  try {
    files = await fs.readdir(ENTRIES_DIR);
  } catch {
    return;
  }
  for (const name of files) {
    const file = path.join(ENTRIES_DIR, name);
    try {
      if (name.endsWith(".tmp")) {
        const stat = await fs.stat(file);
        if (now() - stat.mtimeMs > SWEEP_INTERVAL_MS) await fs.rm(file, { force: true });
        continue;
      }
      /** @type {StoredEntry} */
      const entry = JSON.parse(await fs.readFile(file, "utf8"));
      if (now() > entry.timestamp + entry.expire * 1000) await fs.rm(file, { force: true });
    } catch {
      await fs.rm(file, { force: true }).catch(() => {});
    }
  }
}

/** @type {CacheHandler} */
const diskCacheHandler = {
  async get(cacheKey) {
    const pending = pendingSets.get(cacheKey);
    if (pending) await pending;

    const file = entryFile(cacheKey);
    /** @type {StoredEntry} */
    let stored;
    try {
      stored = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (err) {
      // Missing or unreadable file: a cache miss, never a render error.
      if (/** @type {NodeJS.ErrnoException} */ (err).code !== "ENOENT") debug("get failed", cacheKey, err);
      return undefined;
    }

    if (now() > stored.timestamp + stored.expire * 1000) {
      debug("get expired", cacheKey);
      await fs.rm(file, { force: true }).catch(() => {});
      return undefined;
    }
    if (hasExpiredTag(stored.tags, stored.timestamp)) {
      debug("get expired tag", cacheKey);
      return undefined;
    }
    const revalidate = hasStaleTag(stored.tags, stored.timestamp) ? -1 : stored.revalidate;
    debug("get hit", cacheKey);
    return { ...stored, revalidate, value: streamFromBytes(Buffer.from(stored.value, "base64")) };
  },

  async set(cacheKey, pendingEntry) {
    /** @type {() => void} */
    let resolvePending = () => {};
    pendingSets.set(cacheKey, new Promise((resolve) => (resolvePending = resolve)));
    try {
      const entry = await pendingEntry;
      // Consume the stream exactly once and keep only the bytes (never the stream itself).
      const value = Buffer.from(await new Response(entry.value).arrayBuffer());
      // `expire: 0` is a dynamic entry Next never reads back; storing it is a wasted write.
      if (entry.expire === 0) return;
      /** @type {StoredEntry} */
      const stored = {
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
        value: value.toString("base64"),
      };
      await writeAtomic(entryFile(cacheKey), JSON.stringify(stored));
      debug("set", cacheKey, { tags: entry.tags, revalidate: entry.revalidate, expire: entry.expire });
    } catch (err) {
      // A failed write only loses this entry; the response was already served.
      debug("set failed", cacheKey, err);
    } finally {
      resolvePending();
      pendingSets.delete(cacheKey);
    }
    if (now() - lastSweep > SWEEP_INTERVAL_MS) void sweep();
  },

  /** Once per request: pick up invalidations other instances wrote to the shared tags.json. */
  async refreshTags() {
    await loadTags();
  },

  /** Soft tags (route paths, used by `revalidatePath`): latest expiry across them. */
  async getExpiration(softTags) {
    return Math.max(0, ...softTags.map((tag) => tags.get(tag)?.expired ?? 0));
  },

  /** Called by `revalidateTag` / `updateTag` / `revalidatePath`. Same semantics as the built-in handler. */
  async updateTags(updatedTags, durations) {
    await loadTags();
    const t = now();
    for (const tag of updatedTags) {
      const prev = tags.get(tag) ?? {};
      tags.set(
        tag,
        durations
          ? { ...prev, stale: t, ...(durations.expire !== undefined && { expired: t + durations.expire * 1000 }) }
          : { ...prev, expired: t },
      );
    }
    try {
      await writeAtomic(TAGS_FILE, JSON.stringify(Object.fromEntries(tags)));
      tagsMtimeMs = (await fs.stat(TAGS_FILE)).mtimeMs;
    } catch (err) {
      debug("updateTags failed", updatedTags, err);
    }
    debug("updateTags", updatedTags, durations);
  },
};

debug("dir", CACHE_DIR);
module.exports = diskCacheHandler;
