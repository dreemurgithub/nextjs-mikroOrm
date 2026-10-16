import type { EntityManager } from "@mikro-orm/postgresql";
import { badRequest, forbidden, notFound } from "@/src/lib/http";
import type { Pagination } from "@/src/lib/pagination";
import { getPost } from "@/src/modules/posts/post.service";
import { findPostById } from "@/src/modules/posts/post.queries";
import type { UserView } from "@/src/modules/users/user.queries";
import * as commands from "./comment.commands";
import * as queries from "./comment.queries";

export async function getComment(em: EntityManager, id: string) {
  const comment = await queries.findCommentById(em, id);
  if (!comment) throw notFound("Comment not found");
  return comment;
}

export async function listPostComments(em: EntityManager, postId: string, pagination: Pagination) {
  await getPost(em, postId);
  return queries.listCommentsByPost(em, postId, pagination);
}

export async function createComment(em: EntityManager, actor: UserView, postId: string, content: string) {
  await getPost(em, postId);
  const id = await commands.createComment(em, { authorId: actor.id, postId, content });
  return getComment(em, id);
}

export async function updateComment(em: EntityManager, actor: UserView, id: string, content: string) {
  assertOwner(await getComment(em, id), actor);
  await commands.updateComment(em, id, { content });
  return getComment(em, id);
}

/** Returns the deleted comment (as it was), so callers know which post it belonged to. */
export async function deleteComment(em: EntityManager, actor: UserView, id: string) {
  const comment = await getComment(em, id);
  assertOwner(comment, actor);
  await commands.softDeleteComment(em, id);
  return comment;
}

export async function restoreComment(em: EntityManager, actor: UserView, id: string) {
  const comment = await queries.findCommentById(em, id, { withDeleted: true });
  if (!comment) throw notFound("Comment not found");
  assertOwner(comment, actor);
  if (!comment.deletedAt) throw badRequest("Comment is not deleted");
  if (!(await findPostById(em, comment.postId))) throw badRequest("Restore the post first");
  await commands.restoreComment(em, id);
  return getComment(em, id);
}

function assertOwner(comment: queries.CommentView, actor: UserView) {
  if (comment.author.id !== actor.id) throw forbidden("You are not the author of this comment");
}
