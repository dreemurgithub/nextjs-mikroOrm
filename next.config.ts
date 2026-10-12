import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // MikroORM relies on dynamic imports/reflection; keep it out of the server bundle.
  serverExternalPackages: ["@mikro-orm/core", "@mikro-orm/postgresql", "@mikro-orm/sql", "@mikro-orm/migrations", "@mikro-orm/seeder"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
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
