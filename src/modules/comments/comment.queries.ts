import type { EntityManager } from "@mikro-orm/postgresql";
import { CommentSchema, type Comment } from "@/src/db/entities";
import { paginated, toFindOptions, type Pagination } from "@/src/lib/pagination";

export type CommentView = {
  id: string;
  content: string;
  postId: string;
  author: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function toCommentView(comment: Comment): CommentView {
  return {
    id: comment.id,
    content: comment.content,
    postId: comment.post.id,
    author: { id: comment.author.id, name: comment.author.name },
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt ?? null,
  };
}

export async function findCommentById(em: EntityManager, id: string, opts: { withDeleted?: boolean } = {}) {
  const comment = await em.findOne(
    CommentSchema,
    { id },
    { populate: ["author"], filters: { softDelete: !opts.withDeleted } },
  );
  return comment ? toCommentView(comment) : null;
}

export async function listCommentsByPost(em: EntityManager, postId: string, pagination: Pagination) {
  const [comments, total] = await em.findAndCount(
    CommentSchema,
    { post: postId },
    { ...toFindOptions(pagination), populate: ["author"], orderBy: { createdAt: "asc" } },
  );
  return paginated(comments.map(toCommentView), total, pagination);
}
