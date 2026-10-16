import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEm } from "@/src/db/orm";
import { uuidParam } from "@/src/lib/http";
import { findAllUserIds, findUserById } from "@/src/modules/users/user.queries";
import { DeleteUserButton } from "./delete-user-button";

// With Cache Components an empty array is a build error, so fall back to a placeholder
// (the nil uuid) on an empty DB: it still prerenders the static shell and 404s at request time.
const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";

/** Prerender the static shell of every existing user at build time; new ids render on first visit. */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const ids = await findAllUserIds(await getEm());
  return (ids.length > 0 ? ids : [PLACEHOLDER_ID]).map((id) => ({ id }));
}

export default function UserDetailPage({ params }: PageProps<"/user/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/user" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← Back to users
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Loading user…</p>}>
        <UserDetail params={params} />
      </Suspense>
    </main>
  );
}

async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Postgres rejects malformed uuids, so treat them as "not found" before hitting the DB.
  if (!uuidParam.safeParse(id).success) notFound();

  // Always read fresh from the DB at request time, never at build time.
  await connection();
  const user = await findUserById(await getEm(), id);
  if (!user) notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">{user.name}</h1>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-zinc-500">ID</dt>
        <dd className="font-mono text-zinc-600 dark:text-zinc-400">{user.id}</dd>
        <dt className="text-zinc-500">Email</dt>
        <dd className="font-mono text-zinc-600 dark:text-zinc-400">{user.email}</dd>
        <dt className="text-zinc-500">Joined</dt>
        <dd>{user.createdAt.toISOString().slice(0, 10)}</dd>
        <dt className="text-zinc-500">Updated</dt>
        <dd>{user.updatedAt.toISOString().slice(0, 10)}</dd>
      </dl>
      <DeleteUserButton id={user.id} name={user.name} />
    </>
  );
}
