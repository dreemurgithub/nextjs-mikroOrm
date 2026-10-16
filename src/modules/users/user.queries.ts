import type { EntityManager } from "@mikro-orm/postgresql";
import { UserSchema, type User } from "@/src/db/entities";
import { paginated, toFindOptions, type Pagination } from "@/src/lib/pagination";

/** Read model returned to clients. Never includes the password hash. */
export type UserView = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function toUserView(user: User): UserView {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt ?? null,
  };
}

export async function findUserById(em: EntityManager, id: string, opts: { withDeleted?: boolean } = {}) {
  const user = await em.findOne(UserSchema, { id }, { filters: { softDelete: !opts.withDeleted } });
  return user ? toUserView(user) : null;
}

/** Only for authentication: returns the hash next to the view. Includes soft-deleted users so callers can tell them apart. */
export async function findUserCredentialsByEmail(em: EntityManager, email: string) {
  const user = await em.findOne(
    UserSchema,
    { email: email.toLowerCase() },
    { populate: ["passwordHash"], filters: { softDelete: false } },
  );
  return user ? { user: toUserView(user), passwordHash: user.passwordHash } : null;
}

export async function emailExists(em: EntityManager, email: string): Promise<boolean> {
  const count = await em.count(UserSchema, { email: email.toLowerCase() }, { filters: { softDelete: false } });
  return count > 0;
}

export async function listUsers(em: EntityManager, pagination: Pagination) {
  const [users, total] = await em.findAndCount(
    UserSchema,
    {},
    { ...toFindOptions(pagination), orderBy: { createdAt: "desc" } },
  );
  return paginated(users.map(toUserView), total, pagination);
}

/** Unpaginated — fine for small tables / admin views; prefer `listUsers` for APIs. */
export async function findAllUsers(em: EntityManager) {
  const users = await em.find(UserSchema, {}, { orderBy: { createdAt: "desc" } });
  return users.map(toUserView);
}

/** Soft-deleted users only (the trash), most recently deleted first. */
export async function findDeletedUsers(em: EntityManager) {
  const users = await em.find(
    UserSchema,
    { deletedAt: { $ne: null } },
    { filters: { softDelete: false }, orderBy: { deletedAt: "desc" } },
  );
  return users.map(toUserView);
}

/** Ids of every live user — used by `generateStaticParams` to prerender `/user/[id]` at build time. */
export async function findAllUserIds(em: EntityManager): Promise<string[]> {
  const users = await em.find(UserSchema, {}, { fields: ["id"], orderBy: { createdAt: "desc" } });
  return users.map((u) => u.id);
}
