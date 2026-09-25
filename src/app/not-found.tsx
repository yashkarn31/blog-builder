import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { button } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
        <p className="font-serif text-7xl font-semibold text-accent">404</p>
        <h1 className="mt-4 font-serif text-3xl font-semibold">This page wandered off</h1>
        <p className="mt-3 text-fg-muted">The post may have been unpublished, or the link is mistyped.</p>
        <Link href="/" className={button("primary", "md", "mt-8")}>Back to the blog</Link>
      </main>
    </>
  );
}
