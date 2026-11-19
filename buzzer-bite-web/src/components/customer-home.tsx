"use client";

import { useMemo, useState } from "react";
import type { ExploreStore } from "../app/usuario/explorar/actions";
import CustomerTabBar from "./customer-tab-bar";
import ExploreList from "./explore-list";
import { useNearbyStores } from "./use-nearby-stores";

const categories = ["Antojos", "Comida Rapida", "Dulce", "Fit"] as const;

function matchesCategory(store: ExploreStore, category: (typeof categories)[number]) {
  return store.category.trim().toLocaleLowerCase("es") === category.toLocaleLowerCase("es");
}

export default function CustomerHome({
  name,
  userId,
  latitude,
  longitude,
}: {
  name: string;
  userId: string;
  latitude: number;
  longitude: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Antojos");
  const { stores, favorites, setFavorites, loaded, loadError } = useNearbyStores(latitude, longitude);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return stores.filter((store) => {
      if (category !== "Antojos" && !matchesCategory(store, category)) return false;
      if (!term) return true;
      return store.name.toLocaleLowerCase("es").includes(term);
    });
  }, [category, query, stores]);

  const greeting = name ? `Bienvenido ${name}` : "Bienvenido";

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[396px]">
      <div className="flex flex-col gap-[22px] px-5 pt-6 pb-28">
        <div className="flex h-12 items-start justify-center">
          <img src="/inicio/logo.svg" alt="Buzzer Bite" width={48} height={45.7019} />
        </div>

        <div className="flex flex-col gap-[5px]">
          <h1 className="text-[26px] leading-8 font-bold tracking-[-0.3px] text-[#f3f6f4]">{greeting}</h1>
          <p className="text-[15px] leading-[22px] font-normal text-[#8e9892]">
            Descubre el paquete perfecto para ti.
          </p>
        </div>

        <label className="flex w-full items-center gap-[10px] overflow-hidden rounded-full bg-[#1c211e] px-4 py-[14px]">
          <span className="flex size-5 shrink-0 items-center justify-center">
            <img src="/inicio/search.svg" alt="" width={19.2} height={19.2} />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar restaurantes o comida..."
            aria-label="Buscar restaurantes o comida"
            className="w-full bg-transparent text-[13px] leading-[18px] font-normal text-[#f3f6f4] outline-none placeholder:text-[#8e9892]"
          />
        </label>

        <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2" role="tablist" aria-label="Categorías">
            {categories.map((item) => {
              const selected = item === category;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setCategory(item)}
                  className={`cursor-pointer rounded-full px-[14px] py-2 text-[13px] leading-4 font-semibold whitespace-nowrap ${
                    selected ? "bg-[#f3f6f4] text-[#0b0d0c]" : "bg-[#1c211e] text-[#f3f6f4]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <ExploreList
          userId={userId}
          stores={visible}
          favorites={favorites}
          loaded={loaded}
          loadError={loadError}
          searching={query.trim().length > 0 || (category !== "Antojos" && visible.length !== stores.length)}
          onFavoritesChange={setFavorites}
          heading={false}
        />
      </div>

      <CustomerTabBar
        current="inicio"
        className="fixed bottom-5 left-1/2 w-[min(360px,calc(100%-40px))] -translate-x-1/2"
      />
    </div>
  );
}
