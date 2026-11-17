import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type OwnStore = {
  id: string;
  name?: string;
  address?: string;
  image_url?: string | null;
  user?: { id?: string };
};

export async function requireMerchant() {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const me = await fetch(`${process.env.BUZZER_BITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!me?.ok) redirect("/login");
  const user = await me.json().catch(() => null);
  if (user?.role !== "merchant" || typeof user?.id !== "string") redirect("/");

  return { token, userId: user.id as string };
}

export async function findOwnStore(token: string, userId: string) {
  const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/stores`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (response?.status === 401) redirect("/login");
  const stores = response?.ok ? await response.json().catch(() => null) : null;
  if (!Array.isArray(stores)) return null;

  const store = stores.find((item) => item?.user?.id === userId);
  return (store ?? null) as OwnStore | null;
}
