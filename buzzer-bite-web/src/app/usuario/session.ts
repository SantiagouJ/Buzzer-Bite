import "server-only";
import { redirect } from "next/navigation";
import { CITY_CENTERS } from "../../data/city-centers";
import { canonicalCity } from "../../data/colombia-cities";
import { requireToken } from "../../lib/buzzer-api";
import { getCurrentUser } from "../../lib/roles";

export async function requireConsumer() {
  const token = await requireToken();
  const user = await getCurrentUser(token);

  if (!user) redirect("/login");
  if (user.role !== "consumer") redirect("/");

  const location = typeof user.location === "string" ? user.location : "";
  const city = canonicalCity(location) ?? "Cali";

  return {
    token,
    userId: user.id,
    email: typeof user.email === "string" ? user.email : "",
    fullName: typeof user.full_name === "string" ? user.full_name : "",
    homeCity: canonicalCity(location),
    city,
    center: CITY_CENTERS[city],
  };
}
