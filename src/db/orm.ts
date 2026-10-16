import "server-only";
import { MikroORM, type EntityManager } from "@mikro-orm/postgresql";
import { entities } from "./entities";
import config from "./mikro-orm.config";

/**
 * One ORM (and connection pool) per copy of the entity schemas, reused across hot reloads in dev.
 *
 * Next bundles route handlers and pages separately, so each bundle evaluates its own copy of
 * `./entities`. MikroORM finds metadata by schema object identity: an ORM discovered with the
 * route handlers' schemas cannot query with the pages' ones (`meta.relations` is undefined).
 * Keying by the `entities` array gives each bundle an ORM that knows its own schemas.
 */
const globalForOrm = globalThis as unknown as { orms?: WeakMap<object, Promise<MikroORM>> };

export function getOrm(): Promise<MikroORM> {
  const orms = (globalForOrm.orms ??= new WeakMap());
  let orm = orms.get(entities);
  if (!orm) {
    orm = MikroORM.init(config);
    orms.set(entities, orm);
  }
  return orm;
}

/** Fresh EntityManager (own identity map / unit of work) — use one per request. */
export async function getEm(): Promise<EntityManager> {
  const orm = await getOrm();
  return orm.em.fork();
}
