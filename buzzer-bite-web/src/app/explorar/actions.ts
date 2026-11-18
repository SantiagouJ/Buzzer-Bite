"use server";

import { cookies } from "next/headers";

export type ExploreStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl: string | null;
  distanceKm: number;
  packCount: number;
  fromPrice: number | null;
  pickupStart: string | null;
  pickupEnd: string | null;
  packImageUrl: string | null;
};

export type ExploreFavorite = {
  id: string;
  storeId: string;
};

type PackOffer = {
  storeId: string;
  price: number | null;
  start: string | null;
  end: string | null;
  imageUrl: string | null;
};

const SEARCH_RADIUS_KM = 20;

export async function nearbyStores(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false as const, stores: [] as ExploreStore[] };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) return { ok: false as const, stores: [] as ExploreStore[] };

  const url = new URL(`${process.env.BUZZER_BITE_API_URL}/stores/nearby`);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("radius", String(SEARCH_RADIUS_KM));

  const packsUrl = new URL(`${process.env.BUZZER_BITE_API_URL}/packs`);

  const [response, packsResponse] = await Promise.all([
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
    fetch(packsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
  ]);

  if (!response?.ok) return { ok: false as const, stores: [] as ExploreStore[] };

  const data = await response.json().catch(() => null);
  if (!Array.isArray(data)) return { ok: false as const, stores: [] as ExploreStore[] };

  const packs = packsResponse?.ok ? readOffers(await packsResponse.json().catch(() => null)) : [];
  const offers = offersByStore(packs);

  const stores = data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const store = item as Record<string, unknown>;
    const id = store.id;
    const name = store.name;
    const storeLatitude = Number(store.latitude);
    const storeLongitude = Number(store.longitude);
    const distanceKm = Number(store.distance_km);
    if (typeof id !== "string" || typeof name !== "string") return [];
    if (!Number.isFinite(storeLatitude) || !Number.isFinite(storeLongitude)) return [];
    return [
      {
        id,
        name,
        latitude: storeLatitude,
        longitude: storeLongitude,
        category: typeof store.category === "string" ? store.category : "",
        imageUrl: typeof store.image_url === "string" ? store.image_url : null,
        distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
        packCount: offers.get(id)?.count ?? 0,
        fromPrice: offers.get(id)?.fromPrice ?? null,
        pickupStart: offers.get(id)?.pickupStart ?? null,
        pickupEnd: offers.get(id)?.pickupEnd ?? null,
        packImageUrl: offers.get(id)?.packImageUrl ?? null,
      },
    ];
  });

  return { ok: true as const, stores };
}

export async function exploreFavorites() {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) return [] as ExploreFavorite[];

  const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return [] as ExploreFavorite[];

  const data = await response.json().catch(() => null);
  if (!Array.isArray(data)) return [] as ExploreFavorite[];

  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const favorite = item as Record<string, unknown>;
    const store = favorite.store;
    const storeId =
      store && typeof store === "object" ? (store as Record<string, unknown>).id : null;
    if (typeof favorite.id !== "string" || typeof storeId !== "string") return [];
    return [{ id: favorite.id, storeId }];
  });
}

export async function setStoreFavorite(input: {
  userId: string;
  storeId: string;
  favoriteId: string | null;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token || !input.userId) return { ok: false as const, favorite: null };

  if (input.favoriteId) {
    const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/favorites/${input.favoriteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (!response?.ok) return { ok: false as const, favorite: null };
    return { ok: true as const, favorite: null };
  }

  const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/favorites`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: input.userId, store_id: input.storeId }),
  }).catch(() => null);
  if (!response?.ok) return { ok: false as const, favorite: null };

  const data = await response.json().catch(() => null);
  if (!data || typeof data.id !== "string") return { ok: false as const, favorite: null };
  return {
    ok: true as const,
    favorite: { id: data.id, storeId: input.storeId },
  };
}

function readOffers(data: unknown): PackOffer[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const pack = item as Record<string, unknown>;
    const store = pack.store;
    const storeId =
      store && typeof store === "object" ? (store as Record<string, unknown>).id : null;
    if (typeof storeId !== "string") return [];
    const price = Number(pack.discount_price);
    return [
      {
        storeId,
        price: Number.isFinite(price) ? price : null,
        start: typeof pack.pickup_start === "string" ? pack.pickup_start : null,
        end: typeof pack.pickup_end === "string" ? pack.pickup_end : null,
        imageUrl: typeof pack.image_url === "string" ? pack.image_url : null,
      },
    ];
  });
}

function clockMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function offersByStore(offers: PackOffer[]) {
  const summary = new Map<
    string,
    {
      count: number;
      fromPrice: number | null;
      pickupStart: string | null;
      pickupEnd: string | null;
      packImageUrl: string | null;
    }
  >();

  for (const offer of offers) {
    const current = summary.get(offer.storeId) ?? {
      count: 0,
      fromPrice: null,
      pickupStart: null,
      pickupEnd: null,
      packImageUrl: null,
    };
    current.count += 1;
    if (offer.price !== null && (current.fromPrice === null || offer.price < current.fromPrice)) {
      current.fromPrice = offer.price;
      if (offer.imageUrl) current.packImageUrl = offer.imageUrl;
    } else if (!current.packImageUrl && offer.imageUrl) {
      current.packImageUrl = offer.imageUrl;
    }
    const start = offer.start ? clockMinutes(offer.start) : null;
    const end = offer.end ? clockMinutes(offer.end) : null;
    const currentStart = current.pickupStart ? clockMinutes(current.pickupStart) : null;
    const currentEnd = current.pickupEnd ? clockMinutes(current.pickupEnd) : null;
    if (start !== null && (currentStart === null || start < currentStart)) current.pickupStart = offer.start;
    if (end !== null && (currentEnd === null || end > currentEnd)) current.pickupEnd = offer.end;
    summary.set(offer.storeId, current);
  }

  return summary;
}
