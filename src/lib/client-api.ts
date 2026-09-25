/** fetch wrapper for client components: JSON in/out, throws with the API's error message. */
export async function api<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export async function uploadImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api<{ url: string; width: number; height: number }>("/api/uploads", { method: "POST", body });
}
