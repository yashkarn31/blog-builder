const PALETTE = [
  "bg-sky-600", "bg-indigo-600", "bg-emerald-600", "bg-rose-600",
  "bg-amber-600", "bg-violet-600", "bg-teal-600", "bg-fuchsia-600",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={`${colorFor(name)} inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
