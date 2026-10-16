"use client";

import { useTransition } from "react";
import { restoreUserAction } from "./actions";

export function RestoreUserButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => restoreUserAction(id))}
      disabled={pending}
      className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {pending ? "Restoring…" : "Restore"}
    </button>
  );
}
