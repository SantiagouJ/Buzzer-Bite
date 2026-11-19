"use client";

import { useMemo, useState } from "react";
import type { ExploreStore } from "../app/usuario/explorar/actions";
import CustomerTabBar from "./customer-tab-bar";
import ExploreList from "./explore-list";
import { useNearbyStores } from "./use-nearby-stores";

const filters = ["Todos", "Abiertos", "Cercanos"] as const;
type Filter = (typeof filters)[number];

const NEARBY_KM = 5;

function clockMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function bogotaMinutes() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

function isOpen(store: ExploreStore, now: number) {
  if (store.packCount === 0) return false;
  const start = clockMinutes(store.pickupStart);
  const end = clockMinutes(store.pickupEnd);
  if (start === null || end === null) return false;
  return start <= end ? now >= start && now <= end : now >= start || now <= end;
}

export default function CustomerFavorites({
  userId,
  latitude,
  longitude,
}: {
  userId: string;
  latitude: number;
  longitude: number;
}) {
  const [filter, setFilter] = useState<Filter>("Todos");
  const [now, setNow] = useState(0);
  const { stores, favorites, setFavorites, loaded, loadError } = useNearbyStores(latitude, longitude);

  const favoriteStores = useMemo(() => {
    const ids = new Set(favorites.map((favorite) => favorite.storeId));
    return stores.filter((store) => ids.has(store.id));
  }, [favorites, stores]);

  const visible = useMemo(() => {
    if (filter === "Abiertos") return favoriteStores.filter((store) => isOpen(store, now));
    if (filter === "Cercanos") {
      return favoriteStores
        .filter((store) => store.distanceKm <= NEARBY_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return favoriteStores;
  }, [favoriteStores, filter, now]);

  const stats = [
    { label: "Favoritos", value: favoriteStores.length, className: "font-semibold text-[#f3f6f4]" },
    {
      label: "Disponibles",
      value: favoriteStores.reduce((sum, store) => sum + store.packCount, 0),
      className: "font-bold text-[#2ee07a]",
    },
    {
      label: "Packs",
      value: favoriteStores.reduce((sum, store) => sum + store.totalPackCount, 0),
      className: "font-bold text-[#f3f6f4]",
    },
  ];

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[396px]">
      <div className="flex flex-col gap-[30px] px-5 pt-6 pb-28">
        <div className="flex flex-col gap-4">
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.3px] text-[#f3f6f4]">Favoritos</h1>

          <div className="flex flex-col gap-4">
            <dl className="flex gap-[25px]">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse gap-1 py-3">
                  <dt className="text-[12px] leading-4 font-normal text-[#8e9892]">{stat.label}</dt>
                  <dd className={`text-[20px] leading-6 ${stat.className}`}>{loaded ? stat.value : "–"}</dd>
                </div>
              ))}
            </dl>

            <div className="flex gap-2" role="tablist" aria-label="Filtrar favoritos">
              {filters.map((item) => {
                const selected = item === filter;
                return (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      if (item === "Abiertos") setNow(bogotaMinutes());
                      setFilter(item);
                    }}
                    className={`cursor-pointer rounded-full px-[14px] py-[7px] text-[13px] leading-4 font-semibold whitespace-nowrap ${
                      selected ? "bg-[#f3f6f4] text-[#0b0d0c]" : "bg-[#1c211e] text-[#f3f6f4]"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <ExploreList
          userId={userId}
          stores={visible}
          favorites={favorites}
          loaded={loaded}
          loadError={loadError}
          searching={filter !== "Todos" && favoriteStores.length > 0}
          onFavoritesChange={setFavorites}
          heading={false}
          emptyMessage="Aún no tienes restaurantes favoritos. Toca el corazón en una tarjeta para guardarlo."
        />
      </div>

      <CustomerTabBar
        current="favoritos"
        className="fixed bottom-5 left-1/2 w-[min(360px,calc(100%-40px))] -translate-x-1/2"
      />
    </div>
  );
}
