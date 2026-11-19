"use client";

import { useState } from "react";
import CustomerTabBar from "./customer-tab-bar";
import OfferCard from "./offer-card";
import { formatPrice, pickupLabel } from "./offer-format";
import ProfileCard from "./profile-card";
import { toggleStoreFavorite, useFavorites, useOrigin } from "./use-nearby-stores";

export type RestaurantPack = {
  id: string;
  title: string;
  kind: "sorpresa" | "arreglado";
  price: number | null;
  stock: number;
  pickupStart: string | null;
  pickupEnd: string | null;
  imageUrl: string | null;
};

type RestaurantStore = {
  id: string;
  name: string;
  address: string;
  category: string;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
};

const filters = [
  { kind: "sorpresa", label: "Sorpresa", empty: "No hay packs sorpresa disponibles." },
  { kind: "arreglado", label: "Arreglado", empty: "No hay packs arreglados disponibles." },
] as const;

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLng = radians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RestaurantDetail({
  userId,
  cityLatitude,
  cityLongitude,
  store,
  packs,
}: {
  userId: string;
  cityLatitude: number;
  cityLongitude: number;
  store: RestaurantStore;
  packs: RestaurantPack[];
}) {
  const [kind, setKind] = useState<RestaurantPack["kind"]>("sorpresa");
  const origin = useOrigin(cityLatitude, cityLongitude);
  const [favorites, setFavorites] = useFavorites();
  const isFavorite = favorites.some((favorite) => favorite.storeId === store.id);

  const hasCoordinates = Number.isFinite(store.latitude) && Number.isFinite(store.longitude);
  const distance = origin && hasCoordinates ? `${distanceKm(origin, store).toFixed(1)} km` : null;
  const visible = packs.filter((pack) => pack.kind === kind);
  const filter = filters.find((item) => item.kind === kind) ?? filters[0];

  async function toggleFavorite() {
    const next = await toggleStoreFavorite(userId, store.id, favorites);
    if (next) setFavorites(next);
  }

  return (
    <>
      <ProfileCard
        label="Información del restaurante"
        title={store.name}
        subtitle={store.address}
        banner="/images/profile-banner-gradient.png"
        avatar={store.imageUrl ? { src: store.imageUrl, alt: store.name } : undefined}
      />

      <div className="flex gap-2" role="tablist" aria-label="Tipo de pack">
        {filters.map((item) => {
          const selected = item.kind === kind;
          return (
            <button
              key={item.kind}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setKind(item.kind)}
              className={`cursor-pointer rounded-full px-[14px] py-[7px] text-[13px] leading-4 font-semibold whitespace-nowrap ${
                selected ? "bg-[#f3f6f4] text-[#0b0d0c]" : "bg-[#1c211e] text-[#f3f6f4]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-[13px] leading-[18px] text-[#8e9892]">{filter.empty}</p>
      ) : (
        <div className="flex w-full flex-col gap-[21px]">
          {visible.map((pack) => (
            <OfferCard
              key={pack.id}
              name={pack.title}
              imageUrl={pack.imageUrl}
              imageHeight={129}
              category={store.category}
              priceLabel={pack.price === null ? "Sin precio" : formatPrice(pack.price)}
              priceMuted={pack.price === null}
              favorite={{ active: isFavorite, storeName: store.name, onToggle: () => void toggleFavorite() }}
              distanceLabel={distance}
              countLabel={pack.stock === 1 ? "1 restante" : `${pack.stock} restantes`}
              hoursLabel={pickupLabel(pack.pickupStart, pack.pickupEnd)}
            />
          ))}
        </div>
      )}

      <CustomerTabBar
        current="explorar"
        linkCurrent
        className="fixed bottom-5 left-1/2 w-[min(360px,calc(100%-40px))] -translate-x-1/2"
      />
    </>
  );
}
