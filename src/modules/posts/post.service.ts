import type { EntityManager } from "@mikro-orm/postgresql";
import { badRequest, forbidden, notFound } from "@/src/lib/http";
import type { UserView } from "@/src/modules/users/user.queries";
import * as commands from "./post.commands";
import * as queries from "./post.queries";

export async function getPost(em: EntityManager, id: string) {
  const post = await queries.findPostById(em, id);
  if (!post) throw notFound("Post not found");
  return post;
}

export function listPosts(em: EntityManager, filter: queries.PostListFilter) {
  return queries.listPosts(em, filter);
}

export async function createPost(em: EntityManager, actor: UserView, input: { title: string; content: string }) {
  const id = await commands.createPost(em, { ...input, authorId: actor.id });
  return getPost(em, id);
}

export async function updatePost(em: EntityManager, actor: UserView, id: string, input: commands.UpdatePostCommand) {
  assertOwner(await getPost(em, id), actor);
  await commands.updatePost(em, id, input);
  return getPost(em, id);
}

export async function deletePost(em: EntityManager, actor: UserView, id: string) {
  assertOwner(await getPost(em, id), actor);
  await commands.softDeletePost(em, id);
}

export async function restorePost(em: EntityManager, actor: UserView, id: string) {
  const post = await queries.findPostById(em, id, { withDeleted: true });
  if (!post) throw notFound("Post not found");
  assertOwner(post, actor);
  if (!post.deletedAt) throw badRequest("Post is not deleted");
  await commands.restorePost(em, id);
  return getPost(em, id);
}

function assertOwner(post: queries.PostView, actor: UserView) {
  if (post.author.id !== actor.id) throw forbidden("You are not the author of this post");
}
