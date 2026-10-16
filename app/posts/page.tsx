import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEm } from "@/src/db/orm";
import { findAllPosts } from "@/src/modules/posts/post.queries";

export default function PostsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Posts</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading posts…</p>}>
        <PostList />
      </Suspense>
    </main>
  );
}

async function PostList() {
  // Always read fresh from the DB at request time, never at build time.
  await connection();
  const posts = await findAllPosts(await getEm());

  if (posts.length === 0) return <p className="text-zinc-500">No posts yet.</p>;

  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
      {posts.map((post) => (
        <li key={post.id} className="py-4">
          <Link href={`/posts/${post.id}`} className="text-lg font-medium hover:underline">
            {post.title}
          </Link>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{post.content}</p>
          <p className="mt-2 text-xs text-zinc-500">
            by{" "}
            <Link href={`/user/${post.author.id}`} className="font-medium text-zinc-700 hover:underline dark:text-zinc-300">
              {post.author.name}
            </Link>
            {" · "}
            {post.createdAt.toISOString().slice(0, 10)}
            {" · "}
            {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
          </p>
        </li>
      ))}
    </ul>
  );
}
