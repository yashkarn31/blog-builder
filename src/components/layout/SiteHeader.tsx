import Link from "next/link";
import { PenSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { button } from "@/components/ui/styles";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/dashboard/posts/new" className={button("ghost", "sm", "max-sm:hidden")}>
                <PenSquare className="h-4 w-4" /> Write
              </Link>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Link href="/login" className={button("ghost", "sm")}>
                Log in
              </Link>
              <Link href="/signup" className={button("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
