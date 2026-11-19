import { Suspense } from "react";
import BackLink from "../../../../components/back-link";
import KitchenMap from "../../../../components/kitchen-map";
import { canonicalCity } from "../../../../data/colombia-cities";
import { CITY_CENTERS } from "../../../../data/city-centers";
import { requireToken } from "../../../../lib/buzzer-api";

type KitchenMapPageProps = {
  searchParams: Promise<{
    name?: string;
    category?: string;
    city?: string;
    error?: string;
    detail?: string;
  }>;
};

async function KitchenMapScreen({ searchParams }: KitchenMapPageProps) {
  await requireToken();

  const params = await searchParams;
  const city = canonicalCity(params.city ?? "") ?? "Cali";
  const center = CITY_CENTERS[city];
  const name = params.name?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  return (
    <>
      <h1 className="w-full text-[26px] leading-8 font-bold tracking-[-0.3px]">Marca tu cocina</h1>
      <p className="w-full text-[15px] leading-[22px] text-[#8e9892]">
        Mueve el punto hasta el lugar exacto en {city}.
      </p>
      {!name || !category ? (
        <p className="text-[13px] leading-[18px] text-[#ff8f8f]">
          Vuelve al registro para indicar el restaurante y la cocina.
        </p>
      ) : (
        <KitchenMap
          token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ""}
          city={city}
          name={name}
          category={category}
          latitude={center.latitude}
          longitude={center.longitude}
          error={params.error}
          detail={params.detail}
        />
      )}
    </>
  );
}

export default function KitchenMapPage({ searchParams }: KitchenMapPageProps) {
  return (
    <main className="min-h-dvh bg-[#101311] text-[#f3f6f4]">
      <div className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-5 pb-5">
        <BackLink href="/register/comercio" />
        <Suspense fallback={<p className="text-[15px] text-[#8e9892]">Cargando el mapa...</p>}>
          <KitchenMapScreen searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
