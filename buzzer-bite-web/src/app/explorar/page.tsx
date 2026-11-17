import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ExploreScreen from "../../components/explore-screen";
import { CITY_CENTERS } from "../../data/city-centers";
import { canonicalCity } from "../../data/colombia-cities";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

async function ExplorarGate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const me = await fetch(`${process.env.BUZZER_BITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!me?.ok) redirect("/login");
  const user = await me.json().catch(() => null);
  if (user?.role !== "consumer") redirect("/");

  const city = canonicalCity(typeof user.location === "string" ? user.location : "") ?? "Cali";
  const center = CITY_CENTERS[city];

  return (
      <ExploreScreen
        mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""}
        city={city}
        userId={typeof user.id === "string" ? user.id : ""}
        latitude={center.latitude}
        longitude={center.longitude}
      />
  );
}

export default function ExplorarPage() {
  return (
    <main className={`${inter.className} h-dvh bg-[#101311] text-[#f3f6f4]`}>
      <Suspense
        fallback={
          <p className="px-5 pt-5 text-[15px] leading-[22px] text-[#8e9892]">Cargando el mapa...</p>
        }
      >
        <ExplorarGate />
      </Suspense>
    </main>
  );
}
