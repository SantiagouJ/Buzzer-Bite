import { notFound } from "next/navigation";
import { Suspense } from "react";
import BackButton from "../../../../components/back-button";
import RestaurantDetail, { type RestaurantPack } from "../../../../components/restaurant-detail";
import { buzzerFetch } from "../../../../lib/buzzer-api";
import { requireConsumer } from "../../session";

type RestaurantPageProps = {
  params: Promise<{ id: string }>;
};

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readPacks(data: unknown, storeId: string): RestaurantPack[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const pack = record(item);
    if (!pack || typeof pack.id !== "string") return [];
    if (record(pack.store)?.id !== storeId) return [];
    const stock = Number(pack.stock);
    if (pack.status !== "AVAILABLE" || !(stock > 0)) return [];
    const price = Number(pack.discount_price);
    const title = typeof pack.title === "string" ? pack.title : "Pack";
    return [
      {
        id: pack.id,
        title,
        kind: /sorpresa/i.test(title) ? ("sorpresa" as const) : ("arreglado" as const),
        price: Number.isFinite(price) ? price : null,
        stock,
        pickupStart: typeof pack.pickup_start === "string" ? pack.pickup_start : null,
        pickupEnd: typeof pack.pickup_end === "string" ? pack.pickup_end : null,
        imageUrl: typeof pack.image_url === "string" ? pack.image_url : null,
      },
    ];
  });
}

async function RestaurantContent({ params }: RestaurantPageProps) {
  const { id } = await params;
  const { userId, center } = await requireConsumer();

  const [storeRes, packsRes] = await Promise.all([
    buzzerFetch(`/stores/${encodeURIComponent(id)}`),
    buzzerFetch("/packs"),
  ]);

  if (storeRes?.status === 404 || storeRes?.status === 400) notFound();
  const store = record(storeRes?.ok ? await storeRes.json().catch(() => null) : null);
  if (!store || typeof store.id !== "string" || typeof store.name !== "string") {
    return (
      <p role="alert" className="text-[13px] leading-[18px] text-[#ff8f8f]">
        No se pudo cargar el restaurante.
      </p>
    );
  }

  const packs = readPacks(packsRes?.ok ? await packsRes.json().catch(() => null) : null, store.id);

  return (
    <RestaurantDetail
      userId={userId}
      cityLatitude={center.latitude}
      cityLongitude={center.longitude}
      store={{
        id: store.id,
        name: store.name,
        address: typeof store.address === "string" ? store.address : "",
        category: typeof store.category === "string" ? store.category : "",
        imageUrl: typeof store.image_url === "string" ? store.image_url : null,
        latitude: Number(store.latitude),
        longitude: Number(store.longitude),
      }}
      packs={packs}
    />
  );
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[396px] flex-col items-start gap-[21px] px-5 pt-6 pb-28">
      <BackButton fallbackHref="/usuario/explorar" />
      <Suspense
        fallback={<p className="text-[15px] leading-[22px] text-[#8e9892]">Cargando restaurante...</p>}
      >
        <RestaurantContent params={params} />
      </Suspense>
    </main>
  );
}
