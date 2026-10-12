import type { EntityManager } from "@mikro-orm/postgresql";
import { CommentSchema } from "@/src/db/entities";

export type CreateCommentCommand = { authorId: string; postId: string; content: string };
export type UpdateCommentCommand = { content: string };

export async function createComment(em: EntityManager, cmd: CreateCommentCommand): Promise<string> {
  const comment = em.create(CommentSchema, { content: cmd.content, author: cmd.authorId, post: cmd.postId });
  await em.flush();
  return comment.id;
}

export async function updateComment(em: EntityManager, id: string, cmd: UpdateCommentCommand): Promise<string> {
  const comment = await em.findOneOrFail(CommentSchema, { id });
  comment.content = cmd.content;
  await em.flush();
  return comment.id;
}

export async function softDeleteComment(em: EntityManager, id: string): Promise<string> {
  await em.nativeUpdate(CommentSchema, { id }, { deletedAt: new Date() });
  return id;
}

export async function restoreComment(em: EntityManager, id: string): Promise<string> {
  await em.nativeUpdate(CommentSchema, { id }, { deletedAt: null }, { filters: { softDelete: false } });
  return id;
}
