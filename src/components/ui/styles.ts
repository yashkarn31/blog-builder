// Shared class recipes so buttons/inputs look identical everywhere.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border border-line bg-elevated text-fg hover:bg-muted",
  ghost: "text-fg-muted hover:bg-muted hover:text-fg",
  danger: "bg-danger text-white hover:opacity-90 dark:text-black",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-5 text-sm",
};

export function button(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export const input =
  "w-full rounded-xl border border-line bg-elevated px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export const label = "mb-1.5 block text-sm font-medium text-fg";

export const card = "rounded-2xl border border-line bg-elevated";
