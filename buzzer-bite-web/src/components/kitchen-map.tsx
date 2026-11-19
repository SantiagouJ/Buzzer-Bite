"use client";

import { useEffect, useRef, useState } from "react";
import { saveKitchen } from "../app/register/comercio/mapa/actions";

type KitchenMapProps = {
  token: string;
  city: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  error?: string;
  detail?: string;
};

async function reverseAddress(token: string, latitude: number, longitude: number) {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
  );
  url.searchParams.set("language", "es");
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", token);

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const place = data?.features?.[0]?.place_name;
  return typeof place === "string" ? place : null;
}

export default function KitchenMap({
  token,
  city,
  name,
  category,
  latitude,
  longitude,
  error,
  detail,
}: KitchenMapProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState({ latitude, longitude });
  const [address, setAddress] = useState(city);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const node = mapNode.current;
    if (!node || !token) return;

    const linkId = "mapbox-gl-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.35.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    let map: import("mapbox-gl").Map | undefined;
    let marker: import("mapbox-gl").Marker | undefined;
    let cancelled = false;

    void import("mapbox-gl").then((mapboxModule) => {
      if (cancelled || !mapNode.current) return;
      const mapboxgl = "default" in mapboxModule ? mapboxModule.default : mapboxModule;
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: mapNode.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [longitude, latitude],
        zoom: 13,
      });
      marker = new mapboxgl.Marker({ color: "#2ee07a", draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map);

      const move = (nextLatitude: number, nextLongitude: number) => {
        setPoint({ latitude: nextLatitude, longitude: nextLongitude });
      };

      marker.on("dragend", () => {
        const next = marker?.getLngLat();
        if (next) move(next.lat, next.lng);
      });
      map.on("click", (event) => {
        marker?.setLngLat(event.lngLat);
        move(event.lngLat.lat, event.lngLat.lng);
      });
    });

    return () => {
      cancelled = true;
      marker?.remove();
      map?.remove();
    };
  }, [token, latitude, longitude]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void reverseAddress(token, point.latitude, point.longitude).then((place) => {
        if (!controller.signal.aborted && place) setAddress(place.slice(0, 255));
      });
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [token, point.latitude, point.longitude]);

  async function submitKitchen(formData: FormData) {
    if (photo && photo.size > 0) formData.set("image", photo, photo.name);
    await saveKitchen(formData);
  }

  return (
    <form action={submitKitchen} className="flex w-full flex-col gap-3">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="latitude" value={point.latitude} />
      <input type="hidden" name="longitude" value={point.longitude} />

      <div className="h-[420px] w-full overflow-hidden rounded-[24px] bg-[#1c211e]">
        {token ? (
          <div ref={mapNode} className="h-full w-full" />
        ) : (
          <p className="flex h-full items-center px-4 text-[15px] leading-[22px] text-[#8e9892]">
            Falta NEXT_PUBLIC_MAPBOX_TOKEN para cargar el mapa de {city}.
          </p>
        )}
      </div>

      <label htmlFor="address" className="text-[12px] leading-4 font-medium tracking-[0.35px] text-[#8e9892]">
        DIRECCIÓN
      </label>
      <input
        id="address"
        name="address"
        required
        maxLength={255}
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        className="w-full rounded-[16px] bg-[#1c211e] px-4 py-[13px] text-[15px] leading-[22px] font-normal text-[#f3f6f4] outline-none placeholder:text-[#f3f6f4]/40"
      />

      <label htmlFor="image" className="text-[12px] leading-4 font-medium tracking-[0.35px] text-[#8e9892]">
        FOTO
      </label>
      <input
        id="image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setPhoto(file);
          setPreview((current) => {
            if (current) URL.revokeObjectURL(current);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
        className="w-full rounded-[16px] bg-[#1c211e] px-4 py-[13px] text-[15px] leading-[22px] font-normal text-[#f3f6f4] file:mr-3 file:rounded-full file:border-0 file:bg-[#f3f6f4] file:px-3 file:py-1 file:text-[13px] file:font-semibold file:text-[#0b0d0c]"
      />
      {preview ? (
        <img src={preview} alt="" className="h-24 w-24 rounded-full border-2 border-[#2ee07a] object-cover" />
      ) : null}

      {error === "1" ? (
        <p role="alert" className="text-[13px] leading-[18px] text-[#ff8f8f]">
          {detail || "No se pudo guardar la ubicación. Revisa el punto o la conexión."}
        </p>
      ) : null}

      <button
        type="submit"
        className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] leading-[22px] font-semibold text-[#0b0d0c]"
      >
        Guardar ubicación
      </button>
    </form>
  );
}
