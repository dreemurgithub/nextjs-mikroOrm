import type { EntityManager } from "@mikro-orm/postgresql";
import { Seeder } from "@mikro-orm/seeder";
import { CommentSchema, PostSchema, UserSchema } from "../entities";

type SeedPost = {
  authorEmail: string;
  title: string;
  content: string;
  comments: { authorEmail: string; content: string }[];
};

const seedPosts: SeedPost[] = [
  {
    authorEmail: "admin@example.com",
    title: "Welcome to mikro-seo",
    content: "This is a playground for learning MikroORM with Next.js: migrations, soft delete, restore and CQRS-style modules.",
    comments: [
      { authorEmail: "alice@example.com", content: "Thanks for setting this up!" },
      { authorEmail: "bob@example.com", content: "Looking forward to trying the restore feature." },
    ],
  },
  {
    authorEmail: "alice@example.com",
    title: "Why I prefer uuid primary keys",
    content: "UUIDs can be generated in the app before the insert, don't leak row counts, and merge cleanly across databases.",
    comments: [
      { authorEmail: "carol@example.com", content: "Index size is the trade-off, but usually worth it." },
      { authorEmail: "admin@example.com", content: "uuid v7 fixes most of the locality concerns too." },
    ],
  },
  {
    authorEmail: "alice@example.com",
    title: "Soft delete with a global filter",
    content: "A `deletedAt` column plus a default MikroORM filter hides deleted rows everywhere, and `filters: false` brings them back.",
    comments: [],
  },
  {
    authorEmail: "bob@example.com",
    title: "Migrations: generate, run, revert",
    content: "`migration:generate` diffs the entities against the schema, `migration:run` applies, `migration:revert` rolls back one step.",
    comments: [{ authorEmail: "dave@example.com", content: "Feels just like TypeORM, nice." }],
  },
  {
    authorEmail: "carol@example.com",
    title: "Commands vs queries",
    content: "Writes go through *.commands.ts and return ids; reads go through *.queries.ts and return plain view objects.",
    comments: [
      { authorEmail: "bob@example.com", content: "Keeps the read models from leaking entities to the UI." },
      { authorEmail: "alice@example.com", content: "And the service layer just orchestrates both." },
    ],
  },
  {
    authorEmail: "dave@example.com",
    title: "First post!",
    content: "Hello everyone, just joined.",
    comments: [{ authorEmail: "admin@example.com", content: "Welcome, Dave!" }],
  },
];

/**
 * Idempotent: skips posts whose (author, title) already exists, including soft-deleted ones.
 * Depends on `UserSeeder` having run first — posts by unknown authors are skipped.
 */
export class PostSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const emails = [...new Set(seedPosts.flatMap((p) => [p.authorEmail, ...p.comments.map((c) => c.authorEmail)]))];
    const users = await em.find(UserSchema, { email: { $in: emails } }, { filters: false });
    const usersByEmail = new Map(users.map((u) => [u.email, u]));

    const existing = await em.find(
      PostSchema,
      { title: { $in: seedPosts.map((p) => p.title) } },
      { filters: false, fields: ["title", "author"] },
    );
    const existingKeys = new Set(existing.map((p) => `${p.author.id}:${p.title}`));

    for (const { authorEmail, title, content, comments } of seedPosts) {
      const author = usersByEmail.get(authorEmail);
      if (!author || existingKeys.has(`${author.id}:${title}`)) continue;

      const post = em.create(PostSchema, { title, content, author });
      for (const comment of comments) {
        const commenter = usersByEmail.get(comment.authorEmail);
        if (!commenter) continue;
        em.create(CommentSchema, { content: comment.content, author: commenter, post });
      }
    }
    await em.flush();
  }
}
