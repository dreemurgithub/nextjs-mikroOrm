import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEm } from "@/src/db/orm";
import { findDeletedUsers } from "@/src/modules/users/user.queries";
import { RestoreUserButton } from "./restore-user-button";

export default function DeletedUsersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/user" className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        ← Back to users
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Deleted users</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading deleted users…</p>}>
        <DeletedUserList />
      </Suspense>
    </main>
  );
}

async function DeletedUserList() {
  // Always read fresh from the DB at request time, never at build time.
  await connection();
  const users = await findDeletedUsers(await getEm());

  if (users.length === 0) return <p className="text-zinc-500">No deleted users.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
        <tr>
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Email</th>
          <th className="py-2 pr-4 font-medium">Joined</th>
          <th className="py-2 pr-4 font-medium">Deleted</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-zinc-100 dark:border-zinc-900">
            <td className="py-2 pr-4">{user.name}</td>
            <td className="py-2 pr-4 font-mono text-zinc-600 dark:text-zinc-400">{user.email}</td>
            <td className="py-2 pr-4">{user.createdAt.toISOString().slice(0, 10)}</td>
            <td className="py-2 pr-4">{user.deletedAt?.toISOString().slice(0, 10)}</td>
            <td className="py-2 text-right">
              <RestoreUserButton id={user.id} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
