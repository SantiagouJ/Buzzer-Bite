"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import CustomerTabBar from "./customer-tab-bar";
import ExploreList from "./explore-list";
import { useNearbyStores } from "./use-nearby-stores";

type ExploreScreenProps = {
  mapboxToken: string;
  city: string;
  userId: string;
  latitude: number;
  longitude: number;
};

function storeInitial(name: string) {
  const letter = name.trim().charAt(0);
  return letter ? letter.toLocaleUpperCase("es") : "?";
}

function formatPrice(value: number) {
  return `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)}`;
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
  if (from.period === to.period) return `${from.label}–${to.label} ${to.period}`;
  return `${from.label} ${from.period}–${to.label} ${to.period}`;
}

function distanceLabel(kilometers: number) {
  return `${Math.max(0.1, kilometers).toFixed(1)} km`;
}

function packLabel(count: number) {
  return count === 1 ? "1 pack" : `${count} packs`;
}

export default function ExploreScreen({
  mapboxToken,
  city,
  userId,
  latitude,
  longitude,
}: ExploreScreenProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"lista" | "mapa">("mapa");
  const [mapReady, setMapReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { origin, stores, favorites, setFavorites, loaded, loadError } = useNearbyStores(
    latitude,
    longitude,
  );

  useEffect(() => {
    const node = mapNode.current;
    if (!node || !mapboxToken || !origin || view !== "mapa") return;

    const linkId = "mapbox-gl-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.35.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    let cancelled = false;
    setMapReady(false);

    void import("mapbox-gl").then((mapboxModule) => {
      if (cancelled || !mapNode.current) return;
      const mapboxgl = "default" in mapboxModule ? mapboxModule.default : mapboxModule;
      mapboxgl.accessToken = mapboxToken;
      const map = new mapboxgl.Map({
        container: mapNode.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [origin.longitude, origin.latitude],
        zoom: 13,
      });
      mapRef.current = map;
      map.on("load", () => {
        if (!cancelled) setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [mapboxToken, origin, view]);

  const visibleStores = useMemo(
    () =>
      stores.filter((store) =>
        store.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")),
      ),
    [stores, query],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !origin) return;

    let cancelled = false;
    const markers: import("mapbox-gl").Marker[] = [];

    const onMapClick = () => setSelectedId(null);
    map.on("click", onMapClick);

    void import("mapbox-gl").then((mapboxModule) => {
      if (cancelled || mapRef.current !== map) return;
      const mapboxgl = "default" in mapboxModule ? mapboxModule.default : mapboxModule;

      const pin = document.createElement("img");
      pin.src = "/explorar/location.svg";
      pin.alt = "";
      pin.width = 41.2686;
      pin.height = 41.2686;
      pin.style.display = "block";
      pin.style.width = "41.2686px";
      pin.style.height = "41.2686px";
      markers.push(
        new mapboxgl.Marker({ element: pin, anchor: "bottom" })
          .setLngLat([origin.longitude, origin.latitude])
          .addTo(map),
      );

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);

      for (const store of visibleStores) {
        const badge = document.createElement("div");
        badge.className =
          "flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full border-2 border-[#2ee07a] bg-[#1c211e] text-[18px] leading-none font-bold text-[#f3f6f4]";
        badge.title = store.name;
        badge.classList.add("cursor-pointer");
        badge.addEventListener("click", (event) => {
          event.stopPropagation();
          setSelectedId(store.id);
        });
        if (store.imageUrl) {
          const photo = document.createElement("img");
          photo.src = store.imageUrl;
          photo.alt = "";
          photo.style.width = "100%";
          photo.style.height = "100%";
          photo.style.objectFit = "cover";
          photo.style.display = "block";
          badge.appendChild(photo);
        } else {
          badge.textContent = storeInitial(store.name);
        }
        markers.push(
          new mapboxgl.Marker({ element: badge, anchor: "center" })
            .setLngLat([store.longitude, store.latitude])
            .addTo(map),
        );
        bounds.extend([store.longitude, store.latitude]);
      }

      if (!bounds.isEmpty() && visibleStores.length > 0) {
        map.fitBounds(bounds, {
          padding: { top: 100, right: 56, bottom: 120, left: 56 },
          maxZoom: 14,
        });
      }
    });

    return () => {
      cancelled = true;
      map.off("click", onMapClick);
      markers.forEach((marker) => marker.remove());
    };
  }, [mapReady, origin, visibleStores]);

  const selectedStore = visibleStores.find((store) => store.id === selectedId) ?? null;
  const selectedMeta = selectedStore
    ? [packLabel(selectedStore.packCount), pickupLabel(selectedStore.pickupStart, selectedStore.pickupEnd), distanceLabel(selectedStore.distanceKm)]
        .filter((part): part is string => Boolean(part))
        .join(" · ")
    : "";

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[400px] flex-col gap-[14px] overflow-hidden px-5 pt-5">
      <h1 className="text-[26px] leading-8 font-bold tracking-[-0.3px]">Explorar</h1>

      <label className="flex w-full items-center gap-[10px] overflow-hidden rounded-full bg-[#1c211e] px-4 py-[14px]">
        <img src="/explorar/search.svg" alt="" width={19.2} height={19.2} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar restaurantes o comida"
          placeholder="Buscar restaurantes o comida..."
          className="w-full bg-transparent text-[13px] leading-[18px] font-normal text-[#f3f6f4] outline-none placeholder:text-[#8e9892]"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={view === "lista"}
          onClick={() => setView("lista")}
          className={`cursor-pointer rounded-full px-[14px] py-[7px] text-[13px] leading-4 font-semibold ${
            view === "lista" ? "bg-[#f3f6f4] text-[#0b0d0c]" : "bg-[#1c211e] text-[#f3f6f4]"
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          aria-pressed={view === "mapa"}
          onClick={() => setView("mapa")}
          className={`cursor-pointer rounded-full px-[14px] py-[7px] text-[13px] leading-4 font-semibold ${
            view === "mapa" ? "bg-[#f3f6f4] text-[#0b0d0c]" : "bg-[#1c211e] text-[#f3f6f4]"
          }`}
        >
          Mapa
        </button>
      </div>

      {view === "lista" ? (
        <ExploreList
          userId={userId}
          stores={visibleStores}
          favorites={favorites}
          loaded={loaded}
          loadError={loadError}
          searching={query.trim().length > 0}
          onFavoritesChange={setFavorites}
        />
      ) : null}

      {view === "mapa" && origin?.source === "city" ? (
        <p className="text-[13px] leading-[18px] text-[#8e9892]">
          Mostrando tiendas cerca de {city}.
        </p>
      ) : null}

      {view === "mapa" && loadError ? (
        <p role="alert" className="text-[13px] leading-[18px] text-[#ff8f8f]">
          No se pudieron cargar las tiendas.
        </p>
      ) : null}

      {view === "mapa" && loaded && !loadError && query.trim() && visibleStores.length === 0 ? (
        <p className="text-[13px] leading-[18px] text-[#8e9892]">Ningún restaurante coincide.</p>
      ) : null}

      {view === "mapa" ? (
        <div className="relative -mx-5 min-h-0 flex-1 overflow-hidden rounded-t-[25px] bg-[#1a1a1a]">
          {!origin ? (
            <p className="flex h-full items-center px-5 text-[15px] leading-[22px] text-[#8e9892]">
              Buscando tu ubicación...
            </p>
          ) : mapboxToken ? (
            <div ref={mapNode} className="h-full w-full" />
          ) : (
            <p className="flex h-full items-center px-5 text-[15px] leading-[22px] text-[#8e9892]">
              Falta NEXT_PUBLIC_MAPBOX_TOKEN para cargar el mapa de {city}.
            </p>
          )}
          {selectedStore ? (
            <div className="pointer-events-none absolute inset-0 bg-[#101311]/50" />
          ) : null}
        </div>
      ) : null}

      {view === "mapa" && selectedStore ? (
        <section className="absolute bottom-24 left-5 right-5 z-20 flex flex-col gap-2 overflow-hidden rounded-[22px] bg-[#1c211e] px-4 py-[14px] shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.4)] backdrop-blur-[12px]">
          {selectedStore.category ? (
            <p className="text-[12px] leading-4 font-medium tracking-[0.35px] text-[#2ee07a]">
              {selectedStore.category}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 text-[16px] leading-[22px] font-semibold whitespace-nowrap">
            <p className="truncate tracking-[-0.1px] text-[#f3f6f4]">{selectedStore.name}</p>
            {selectedStore.fromPrice !== null ? (
              <p className="shrink-0 text-[#2ee07a]">{formatPrice(selectedStore.fromPrice)}</p>
            ) : null}
          </div>
          <p className="text-[13px] leading-[18px] font-normal text-[#8e9892]">{selectedMeta}</p>
          <Link
            href={`/usuario/restaurante/${selectedStore.id}`}
            className="flex w-full items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] leading-[22px] font-semibold text-[#0b0d0c]"
          >
            Ver restaurante
          </Link>
        </section>
      ) : null}

      <CustomerTabBar current="explorar" className="absolute bottom-5 left-5 right-5" />
    </div>
  );
}
