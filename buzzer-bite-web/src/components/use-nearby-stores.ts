"use client";

import { useEffect, useState } from "react";
import {
  exploreFavorites,
  nearbyStores,
  setStoreFavorite,
  type ExploreFavorite,
  type ExploreStore,
} from "../app/usuario/explorar/actions";

export type Origin = {
  latitude: number;
  longitude: number;
  source: "gps" | "city";
};

type StoresResult = {
  origin: Origin;
  ok: boolean;
  stores: ExploreStore[];
};

export function useOrigin(latitude: number, longitude: number) {
  const [origin, setOrigin] = useState<Origin | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fallBackToCity = () => {
      if (!cancelled) setOrigin({ latitude, longitude, source: "city" });
    };

    if (!navigator.geolocation) {
      queueMicrotask(fallBackToCity);
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: "gps",
        });
      },
      fallBackToCity,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  return origin;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<ExploreFavorite[]>([]);

  useEffect(() => {
    let cancelled = false;
    void exploreFavorites().then((next) => {
      if (!cancelled) setFavorites(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return [favorites, setFavorites] as const;
}

export async function toggleStoreFavorite(
  userId: string,
  storeId: string,
  favorites: ExploreFavorite[],
) {
  const current = favorites.find((favorite) => favorite.storeId === storeId) ?? null;
  const result = await setStoreFavorite({ userId, storeId, favoriteId: current?.id ?? null });
  if (!result.ok) return null;
  const others = favorites.filter((favorite) => favorite.storeId !== storeId);
  return result.favorite ? [...others, result.favorite] : others;
}

export function useNearbyStores(latitude: number, longitude: number) {
  const origin = useOrigin(latitude, longitude);
  const [favorites, setFavorites] = useFavorites();
  const [result, setResult] = useState<StoresResult | null>(null);

  useEffect(() => {
    if (!origin) return;
    let cancelled = false;
    void nearbyStores(origin.latitude, origin.longitude).then((next) => {
      if (!cancelled) setResult({ origin, ok: next.ok, stores: next.stores });
    });
    return () => {
      cancelled = true;
    };
  }, [origin]);

  const current = result !== null && result.origin === origin ? result : null;

  return {
    origin,
    stores: result?.stores ?? [],
    loaded: current !== null,
    loadError: current !== null && !current.ok,
    favorites,
    setFavorites,
  };
}
