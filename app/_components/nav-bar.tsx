import Link from "next/link";
import { Suspense } from "react";
import { NavLinkList, NavLinks } from "./nav-links";

export function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-background/80 backdrop-blur dark:border-zinc-800">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          mikro-seo
        </Link>
        {/* usePathname can suspend on routes with unknown dynamic params (cacheComponents). */}
        <Suspense fallback={<NavLinkList pathname={null} />}>
          <NavLinks />
        </Suspense>
      </nav>
    </header>
  );
}
