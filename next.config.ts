import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MikroORM relies on dynamic imports/reflection; keep it out of the server bundle.
  serverExternalPackages: ["@mikro-orm/core", "@mikro-orm/postgresql", "@mikro-orm/sql", "@mikro-orm/migrations", "@mikro-orm/seeder"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // `"use cache: disk"` → cache entries stored as files in $CACHE_CUSTOM_DIR (fallback ./cache-custom).
  // Used for posts and comments; see src/modules/posts/post.cache.ts.
  cacheHandlers: {
    disk: require.resolve("./cache-handlers/disk-cache-handler.js"),
  },
  cacheLife: {
    // Refreshed every hour (stale-while-revalidate); writes still expire it immediately via tags.
    hourly: {
      stale: 5 * 60, // client router may reuse it for 5 min without asking the server
      revalidate: 60 * 60, // after 1h: serve the cached value, regenerate in the background
      expire: 24 * 60 * 60, // after 1 day without traffic: drop it, next request waits for fresh data
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
