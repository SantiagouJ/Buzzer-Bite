import "server-only";
import { authFetch, getToken } from "./buzzer-api";
import type { CurrentUser, UserRole } from "../types/user";

export async function getCurrentUser(token?: string): Promise<CurrentUser | null> {
  const sessionToken = token ?? (await getToken());
  if (!sessionToken) return null;

  const response = await authFetch(sessionToken, "/auth/me");
  if (!response?.ok) return null;

  const user = await response.json().catch(() => null);
  if (typeof user?.id !== "string") return null;
  return user as CurrentUser;
}

export async function getUserRole(token?: string): Promise<UserRole | null> {
  const user = await getCurrentUser(token);
  return user?.role === "merchant" || user?.role === "consumer" ? user.role : null;
}

export function homeForRole(role: UserRole | null) {
  if (role === "merchant") return "/restaurant";
  if (role === "consumer") return "/usuario/inicio";
  return "/";
}
