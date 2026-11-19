import "server-only";
import { redirect } from "next/navigation";
import { authFetch, requireToken } from "../../lib/buzzer-api";
import { getCurrentUser } from "../../lib/roles";
import type { OwnStore } from "../../types/store";

export type { OwnStore };

export async function requireMerchant() {
  const token = await requireToken();
  const user = await getCurrentUser(token);

  if (!user) redirect("/login");
  if (user.role !== "merchant") redirect("/");

  return { token, userId: user.id };
}

export async function findOwnStore(token: string, userId: string) {
  const response = await authFetch(token, "/stores");
  if (response?.status === 401) redirect("/login");
  const stores = response?.ok ? await response.json().catch(() => null) : null;
  if (!Array.isArray(stores)) return null;

  const store = stores.find((item) => item?.user?.id === userId);
  return (store ?? null) as OwnStore | null;
}
