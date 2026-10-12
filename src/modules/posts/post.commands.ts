import type { EntityManager } from "@mikro-orm/postgresql";
import { CommentSchema, PostSchema } from "@/src/db/entities";

export type CreatePostCommand = { authorId: string; title: string; content: string };
export type UpdatePostCommand = { title?: string; content?: string };

export async function createPost(em: EntityManager, cmd: CreatePostCommand): Promise<string> {
  const post = em.create(PostSchema, {
    title: cmd.title,
    content: cmd.content,
    author: cmd.authorId,
  });
  await em.flush();
  return post.id;
}

export async function updatePost(em: EntityManager, id: string, cmd: UpdatePostCommand): Promise<string> {
  const post = await em.findOneOrFail(PostSchema, { id });
  em.assign(post, cmd);
  await em.flush();
  return post.id;
}

/** Soft deletes the post and its live comments with the same `deletedAt` stamp. */
export async function softDeletePost(em: EntityManager, id: string): Promise<string> {
  const deletedAt = new Date();
  await em.transactional(async (tx) => {
    await tx.nativeUpdate(CommentSchema, { post: id, deletedAt: null }, { deletedAt });
    await tx.nativeUpdate(PostSchema, { id }, { deletedAt });
  });
  return id;
}

/** Restores the post plus only the comments removed together with it. */
export async function restorePost(em: EntityManager, id: string): Promise<string> {
  await em.transactional(async (tx) => {
    const post = await tx.findOneOrFail(PostSchema, { id }, { filters: { softDelete: false } });
    const deletedAt = post.deletedAt;
    if (!deletedAt) return;
    await tx.nativeUpdate(CommentSchema, { post: id, deletedAt }, { deletedAt: null }, { filters: { softDelete: false } });
    post.deletedAt = null;
  });
  return id;
}
