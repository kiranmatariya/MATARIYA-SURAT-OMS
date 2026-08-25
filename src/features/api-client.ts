export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers }, cache: "no-store" });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Database request failed.");
  return body as T;
}
