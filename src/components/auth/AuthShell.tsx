export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="animate-fade-up rounded-3xl border border-line bg-elevated p-7 shadow-xl shadow-black/[0.03] sm:p-9">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-7 mt-2 text-fg-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
