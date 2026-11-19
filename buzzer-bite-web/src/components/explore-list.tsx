"use client";

import type { ExploreFavorite, ExploreStore } from "../app/usuario/explorar/actions";
import OfferCard from "./offer-card";
import { formatPrice, pickupLabel } from "./offer-format";
import { toggleStoreFavorite } from "./use-nearby-stores";

type ExploreListProps = {
  userId: string;
  stores: ExploreStore[];
  favorites: ExploreFavorite[];
  loaded: boolean;
  loadError: boolean;
  searching: boolean;
  onFavoritesChange: (favorites: ExploreFavorite[]) => void;
  heading?: boolean;
  emptyMessage?: string;
};

function packLabel(count: number) {
  return count === 1 ? "1 pack" : `${count} packs`;
}

export default function ExploreList({
  userId,
  stores,
  favorites,
  loaded,
  loadError,
  searching,
  onFavoritesChange,
  heading = true,
  emptyMessage,
}: ExploreListProps) {
  const favoriteStores = new Set(favorites.map((favorite) => favorite.storeId));

  async function toggleFavorite(storeId: string) {
    const next = await toggleStoreFavorite(userId, storeId, favorites);
    if (next) onFavoritesChange(next);
  }

  return (
    <div className={heading ? "min-h-0 flex-1 overflow-y-auto pb-28" : undefined}>
      {heading ? (
        <p className="text-[15px] leading-[22px] text-[#8e9892]">Restaurantes cerca de ti</p>
      ) : null}

      {loadError ? (
        <p role="alert" className="mt-[14px] text-[13px] leading-[18px] text-[#ff8f8f]">
          No se pudieron cargar las tiendas.
        </p>
      ) : null}

      {!loaded && !loadError ? (
        <p className="mt-[14px] text-[15px] leading-[22px] text-[#8e9892]">Buscando tu ubicación...</p>
      ) : null}

      {loaded && !loadError && stores.length === 0 ? (
        <p className="mt-[14px] text-[13px] leading-[18px] text-[#8e9892]">
          {searching ? "Ningún restaurante coincide." : (emptyMessage ?? "No hay restaurantes en este radio.")}
        </p>
      ) : null}

      <div className={`${heading ? "mt-[14px] " : ""}flex flex-col gap-[14px]`}>
        {stores.map((store) => (
          <OfferCard
            key={store.id}
            name={store.name}
            href={`/usuario/restaurante/${store.id}`}
            imageUrl={store.packImageUrl}
            imageHeight={112}
            category={store.category}
            logo={{ url: store.imageUrl }}
            priceLabel={store.fromPrice === null ? "Sin packs" : formatPrice(store.fromPrice)}
            priceMuted={store.fromPrice === null}
            favorite={{
              active: favoriteStores.has(store.id),
              storeName: store.name,
              onToggle: () => void toggleFavorite(store.id),
            }}
            distanceLabel={`${store.distanceKm.toFixed(1)} km`}
            countLabel={packLabel(store.packCount)}
            hoursLabel={pickupLabel(store.pickupStart, store.pickupEnd)}
          />
        ))}
      </div>
    </div>
  );
}
