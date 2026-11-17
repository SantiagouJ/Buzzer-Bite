"use client";

import { setStoreFavorite, type ExploreFavorite, type ExploreStore } from "../app/explorar/actions";

type ExploreListProps = {
  userId: string;
  stores: ExploreStore[];
  favorites: ExploreFavorite[];
  loaded: boolean;
  loadError: boolean;
  searching: boolean;
  onFavoritesChange: (favorites: ExploreFavorite[]) => void;
};

function storeInitial(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toLocaleUpperCase("es") : "?";
}

function packLabel(count: number) {
  return count === 1 ? "1 pack" : `${count} packs`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\s/g, "");
}

function formatClock(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const label = minute === 0 ? `${hour12}` : `${hour12}:${String(minute).padStart(2, "0")}`;
  return { period, label };
}

function pickupLabel(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const from = formatClock(start);
  const to = formatClock(end);
  if (!from || !to) return null;
  if (from.period === to.period) return `${from.label}-${to.label} ${to.period}`;
  return `${from.label} ${from.period}-${to.label} ${to.period}`;
}

export default function ExploreList({
  userId,
  stores,
  favorites,
  loaded,
  loadError,
  searching,
  onFavoritesChange,
}: ExploreListProps) {
  const favoriteByStore = new Map(favorites.map((favorite) => [favorite.storeId, favorite]));

  async function toggleFavorite(storeId: string) {
    const current = favoriteByStore.get(storeId) ?? null;
    const result = await setStoreFavorite({
      userId,
      storeId,
      favoriteId: current?.id ?? null,
    });
    if (!result.ok) return;
    if (result.favorite) {
      onFavoritesChange([...favorites.filter((favorite) => favorite.storeId !== storeId), result.favorite]);
      return;
    }
    onFavoritesChange(favorites.filter((favorite) => favorite.storeId !== storeId));
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-28">
      <p className="text-[15px] leading-[22px] text-[#8e9892]">Restaurantes cerca de ti</p>

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
          {searching ? "Ningún restaurante coincide." : "No hay restaurantes en este radio."}
        </p>
      ) : null}

      <div className="mt-[14px] flex flex-col gap-[14px]">
        {stores.map((store) => {
          const favorite = favoriteByStore.get(store.id);
          const hours = pickupLabel(store.pickupStart, store.pickupEnd);
          return (
            <article key={store.id} className="relative w-full overflow-hidden rounded-[20px] bg-[#1c211e]">
              <div className="relative h-[112px] overflow-hidden bg-[#151a17]">
                {store.packImageUrl ? (
                  <img
                    src={store.packImageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center text-[42px] leading-none font-bold text-[#f3f6f4]/10"
                  >
                    {storeInitial(store.name)}
                  </span>
                )}
                {store.category ? (
                  <span className="absolute top-3 right-3 max-w-[45%] truncate rounded-full bg-[#f3f6f4] px-[9px] py-[5px] text-[9px] leading-[11px] font-semibold text-[#0b0d0c]">
                    {store.category}
                  </span>
                ) : null}
              </div>

              <div className="absolute top-[87px] left-4 flex size-[50px] items-center justify-center overflow-hidden rounded-full border-2 border-[#2ee07a] bg-[#1c211e] text-[18px] leading-none font-bold text-[#f3f6f4]">
                {store.imageUrl ? (
                  <img src={store.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  storeInitial(store.name)
                )}
              </div>

              <div className="flex flex-col gap-4 px-4 pt-[30px] pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[17px] leading-[22px] font-bold tracking-[-0.1px] text-[#f0f3f1]">
                      {store.name}
                    </h2>
                    <p
                      className={`text-[13px] leading-[18px] font-medium ${
                        store.fromPrice === null ? "text-[#8e9892]" : "text-[#2ee07a]"
                      }`}
                    >
                      {store.fromPrice === null ? "Sin packs" : formatPrice(store.fromPrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-pressed={Boolean(favorite)}
                    aria-label={
                      favorite ? `Quitar ${store.name} de favoritos` : `Guardar ${store.name} en favoritos`
                    }
                    onClick={() => void toggleFavorite(store.id)}
                    className="shrink-0 cursor-pointer"
                  >
                    <img
                      src={favorite ? "/explorar/heart-filled.svg" : "/explorar/heart.svg"}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 text-[12px] leading-4 text-[#8a948d]">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex items-center gap-1">
                      <img src="/explorar/pin.svg" alt="" width={14} height={14} />
                      {store.distanceKm.toFixed(1)} km
                    </span>
                    <span className="flex items-center gap-1">
                      <img src="/explorar/bag.svg" alt="" width={16} height={16} />
                      {packLabel(store.packCount)}
                    </span>
                  </div>
                  {hours ? (
                    <span className="flex shrink-0 items-center gap-1">
                      <img src="/explorar/clock.svg" alt="" width={16} height={16} />
                      {hours}
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
