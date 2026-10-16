import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import { listCommentsByPost } from "@/src/modules/comments/comment.queries";
import { findPostById } from "@/src/modules/posts/post.queries";

export default function PostDetailPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/posts" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← Back to posts
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading post…</p>}>
        <PostDetail params={params} />
      </Suspense>
    </main>
  );
}

async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Postgres rejects malformed uuids, so treat them as "not found" before hitting the DB.
  if (!uuidParam.safeParse(id).success) notFound();

  const em = await getEm();
  const post = await findPostById(em, id);
  if (!post) notFound();
  const comments = await listCommentsByPost(em, post.id, { page: 1, pageSize: 100 });

  return (
    <article>
      <h1 className="text-2xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        by{" "}
        <Link href={`/user/${post.author.id}`} className="font-medium text-zinc-700 hover:underline dark:text-zinc-300">
          {post.author.name}
        </Link>
        {" · "}
        {post.createdAt.toISOString().slice(0, 10)}
      </p>
      <p className="mt-6 whitespace-pre-wrap leading-7">{post.content}</p>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Comments ({comments.total})</h2>
        {comments.items.length === 0 ? (
          <p className="text-sm text-zinc-500">No comments yet.</p>
        ) : (
          <ul className="space-y-4">
            {comments.items.map((comment) => (
              <li key={comment.id} className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                <p className="mb-1 text-xs text-zinc-500">
                  <Link href={`/user/${comment.author.id}`} className="font-medium text-zinc-700 hover:underline dark:text-zinc-300">
                    {comment.author.name}
                  </Link>
                  {" · "}
                  {comment.createdAt.toISOString().slice(0, 10)}
                </p>
                <p className="whitespace-pre-wrap">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
