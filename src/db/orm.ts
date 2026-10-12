import "server-only";
import { MikroORM, type EntityManager } from "@mikro-orm/postgresql";
import config from "./mikro-orm.config";

// Reuse one ORM (and its connection pool) across hot reloads in dev.
const globalForOrm = globalThis as unknown as { ormPromise?: Promise<MikroORM> };

export function getOrm(): Promise<MikroORM> {
  globalForOrm.ormPromise ??= MikroORM.init(config);
  return globalForOrm.ormPromise;
}

/** Fresh EntityManager (own identity map / unit of work) — use one per request. */
export async function getEm(): Promise<EntityManager> {
  const orm = await getOrm();
  return orm.em.fork();
}
