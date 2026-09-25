export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/**
 * Returns `base`, or `base-2`, `base-3`… — the first one `exists` says is free.
 */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = base || "untitled";
  let candidate = root;
  for (let i = 2; await exists(candidate); i++) candidate = `${root}-${i}`;
  return candidate;
}
