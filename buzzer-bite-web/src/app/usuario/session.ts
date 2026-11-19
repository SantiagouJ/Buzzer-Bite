import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CITY_CENTERS } from "../../data/city-centers";
import { canonicalCity } from "../../data/colombia-cities";

export async function requireConsumer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const me = await fetch(`${process.env.BUZZER_BITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!me?.ok) redirect("/login");
  const user = await me.json().catch(() => null);
  if (user?.role !== "consumer" || typeof user?.id !== "string") redirect("/");

  const location = typeof user.location === "string" ? user.location : "";
  const city = canonicalCity(location) ?? "Cali";

  return {
    token,
    userId: user.id as string,
    email: typeof user.email === "string" ? user.email : "",
    fullName: typeof user.full_name === "string" ? user.full_name : "",
    homeCity: canonicalCity(location),
    city,
    center: CITY_CENTERS[city],
  };
}
