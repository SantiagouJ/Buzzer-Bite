import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "coffee_token";

export function apiUrl(path: string) {
  return `${process.env.BUZZER_BITE_API_URL}${path}`;
}

export async function getToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function requireToken() {
  const token = await getToken();
  if (!token) redirect("/login");
  return token;
}

// Low-level authenticated fetch: never redirects, returns null on network errors.
// Use it from server actions called by client components, where a redirect is not wanted.
export function authFetch(token: string, path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(apiUrl(path), {
    cache: "no-store",
    ...options,
    headers,
  }).catch(() => null);
}

// Reads the session cookie, calls the API and sends the user to /login when the session expired.
export async function buzzerFetch(path: string, options: RequestInit = {}) {
  const token = await requireToken();
  const response = await authFetch(token, path, options);
  if (response?.status === 401) redirect("/login");
  return response;
}
