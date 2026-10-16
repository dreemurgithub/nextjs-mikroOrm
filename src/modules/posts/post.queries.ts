import { raw, type EntityManager, type FilterQuery } from "@mikro-orm/postgresql";
import { CommentSchema, PostSchema, type Post } from "@/src/db/entities";
import { paginated, toFindOptions, type Pagination } from "@/src/lib/pagination";

export type PostView = {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string };
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PostListFilter = Pagination & {
  authorId?: string;
  /** `only` = trash view, lists soft-deleted posts exclusively. */
  deleted?: "exclude" | "only";
};

function toPostView(post: Post, commentCount: number): PostView {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    author: { id: post.author.id, name: post.author.name },
    commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    deletedAt: post.deletedAt ?? null,
  };
}

/** Live (not soft-deleted) comment counts for a set of posts, in one grouped query. */
async function countComments(em: EntityManager, postIds: string[]): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const rows = await em
    .createQueryBuilder(CommentSchema, "c")
    .select(["c.post", raw("count(*)").as("count")])
    // explicit: query builder filters are not something to rely on implicitly
    .where({ post: { $in: postIds }, deletedAt: null })
    .groupBy("c.post")
    .execute<{ post: string; count: string }[]>();
  return new Map(rows.map((r) => [r.post, Number(r.count)]));
}

export async function findPostById(em: EntityManager, id: string, opts: { withDeleted?: boolean } = {}) {
  const post = await em.findOne(
    PostSchema,
    { id },
    { populate: ["author"], filters: { softDelete: !opts.withDeleted } },
  );
  if (!post) return null;
  const counts = await countComments(em, [post.id]);
  return toPostView(post, counts.get(post.id) ?? 0);
}

export async function listPosts(em: EntityManager, filter: PostListFilter) {
  const onlyDeleted = filter.deleted === "only";
  const where: FilterQuery<Post> = {
    ...(filter.authorId && { author: filter.authorId }),
    ...(onlyDeleted && { deletedAt: { $ne: null } }),
  };
  const [posts, total] = await em.findAndCount(PostSchema, where, {
    ...toFindOptions(filter),
    populate: ["author"],
    orderBy: onlyDeleted ? { deletedAt: "desc" } : { createdAt: "desc" },
    filters: { softDelete: !onlyDeleted },
  });
  const counts = await countComments(em, posts.map((p) => p.id));
  return paginated(posts.map((p) => toPostView(p, counts.get(p.id) ?? 0)), total, filter);
}

/** Unpaginated — fine for small tables / page views; prefer `listPosts` for APIs. */
export async function findAllPosts(em: EntityManager) {
  const posts = await em.find(PostSchema, {}, { populate: ["author"], orderBy: { createdAt: "desc" } });
  const counts = await countComments(em, posts.map((p) => p.id));
  return posts.map((p) => toPostView(p, counts.get(p.id) ?? 0));
}
