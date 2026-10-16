"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/user", label: "Users" },
  { href: "/posts", label: "Posts" },
] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Renders the links; `pathname` is null when rendered as the Suspense fallback. */
export function NavLinkList({ pathname }: { pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1 text-sm">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks() {
  return <NavLinkList pathname={usePathname()} />;
}
