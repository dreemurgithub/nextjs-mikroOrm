import Link from "next/link";
import { Suspense } from "react";
import { getCachedUsers } from "@/src/modules/users/user.cache";

export default function UsersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link href="/user/deleted" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Deleted users →
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading users…</p>}>
        <UserList />
      </Suspense>
    </main>
  );
}

async function UserList() {
  // Served from the "use cache" entry: filled from the DB at build time (so the list is part of
  // the prerendered HTML), refreshed only when a user write invalidates the "users" tag.
  const users = await getCachedUsers();

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
