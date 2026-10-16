"use client";

import { useTransition } from "react";
import { softDeleteUserAction } from "./actions";

export function DeleteUserButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Delete ${name}? Their posts and comments will be deleted too (can be restored).`)) return;
    startTransition(() => softDeleteUserAction(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="mt-8 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? "Deleting…" : "Delete user"}
    </button>
  );
}
