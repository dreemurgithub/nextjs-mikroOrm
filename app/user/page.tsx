import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getEm } from "@/src/db/orm";
import { findAllUsers } from "@/src/modules/users/user.queries";

export default function UsersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>
      <Suspense fallback={<p className="text-zinc-500">Loading users…</p>}>
        <UserList />
      </Suspense>
    </main>
  );
}

async function UserList() {
  // Always read fresh from the DB at request time, never at build time.
  await connection();
  const users = await findAllUsers(await getEm());

  if (users.length === 0) return <p className="text-zinc-500">No users yet.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
        <tr>
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Email</th>
          <th className="py-2 font-medium">Joined</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
          >
            {/* A link per cell makes the whole row clickable without a client component. */}
            <td>
              <Link href={`/user/${user.id}`} className="block py-2 pr-4">
                {user.name}
              </Link>
            </td>
            <td>
              <Link href={`/user/${user.id}`} tabIndex={-1} className="block py-2 pr-4 font-mono text-zinc-600 dark:text-zinc-400">
                {user.email}
              </Link>
            </td>
            <td>
              <Link href={`/user/${user.id}`} tabIndex={-1} className="block py-2">
                {user.createdAt.toISOString().slice(0, 10)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
