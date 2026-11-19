import { Suspense } from "react";
import ExploreScreen from "../../../components/explore-screen";
import { requireConsumer } from "../session";

async function ExplorarGate() {
  const { userId, city, center } = await requireConsumer();

  return (
    <ExploreScreen
      mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""}
      city={city}
      userId={userId}
      latitude={center.latitude}
      longitude={center.longitude}
    />
  );
}

export default function ExplorarPage() {
  return (
    <main className="h-dvh">
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
