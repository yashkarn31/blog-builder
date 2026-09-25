import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 text-sm text-fg-muted sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden text-fg-subtle sm:inline">Stories and ideas from the AnalyticsLiv team.</span>
        </div>
        <p className="text-fg-subtle">© {new Date().getFullYear()} Inkwell · Built with Next.js</p>
      </div>
    </footer>
  );
}
