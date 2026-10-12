import type { EntityManager } from "@mikro-orm/postgresql";
import { CommentSchema, PostSchema, UserSchema } from "@/src/db/entities";
import { hashPassword } from "@/src/lib/password";

export type CreateUserCommand = { email: string; name: string; password: string };
export type UpdateUserCommand = { name?: string; password?: string };

/** Commands change state and return only the affected id; read it back through a query. */
export async function createUser(em: EntityManager, cmd: CreateUserCommand): Promise<string> {
  const user = em.create(UserSchema, {
    email: cmd.email.toLowerCase(),
    name: cmd.name,
    passwordHash: await hashPassword(cmd.password),
  });
  await em.flush();
  return user.id;
}

export async function updateUser(em: EntityManager, id: string, cmd: UpdateUserCommand): Promise<string> {
  const user = await em.findOneOrFail(UserSchema, { id });
  if (cmd.name !== undefined) user.name = cmd.name;
  if (cmd.password !== undefined) user.passwordHash = await hashPassword(cmd.password);
  await em.flush();
  return user.id;
}

/** Soft deletes the user and cascades to their posts and comments, stamped with the same `deletedAt`. */
export async function softDeleteUser(em: EntityManager, id: string): Promise<string> {
  const deletedAt = new Date();
  await em.transactional(async (tx) => {
    await tx.nativeUpdate(CommentSchema, { author: id, deletedAt: null }, { deletedAt });
    await tx.nativeUpdate(PostSchema, { author: id, deletedAt: null }, { deletedAt });
    await tx.nativeUpdate(UserSchema, { id }, { deletedAt });
  });
  return id;
}

/** Restores the user plus only the posts/comments removed by that same cascade (matched by timestamp). */
export async function restoreUser(em: EntityManager, id: string): Promise<string> {
  await em.transactional(async (tx) => {
    const user = await tx.findOneOrFail(UserSchema, { id }, { filters: { softDelete: false } });
    const deletedAt = user.deletedAt;
    if (!deletedAt) return;
    const options = { filters: { softDelete: false } };
    await tx.nativeUpdate(PostSchema, { author: id, deletedAt }, { deletedAt: null }, options);
    await tx.nativeUpdate(CommentSchema, { author: id, deletedAt }, { deletedAt: null }, options);
    user.deletedAt = null;
  });
  return id;
}
