"use client";

import { useId, useMemo, useState } from "react";
import { COLOMBIA_CITIES, normalizeCity } from "../data/colombia-cities";

type CityInputProps = {
  id: string;
  className: string;
};

export default function CityInput({ id, className }: CityInputProps) {
  const listId = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const query = normalizeCity(value);
    const cities = query
      ? COLOMBIA_CITIES.filter((city) => normalizeCity(city).includes(query))
      : COLOMBIA_CITIES;
    return cities.slice(0, 8);
  }, [value]);

  return (
    <div className="relative w-full">
      <input
        id={id}
        name="location"
        type="text"
        required
        maxLength={80}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder="Cali"
        value={value}
        className={className}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && matches.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-[16px] bg-[#1c211e] py-1"
        >
          {matches.map((city) => (
            <li key={city} role="option" aria-selected={city === value}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-[15px] leading-[22px] font-normal text-[#f3f6f4]"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setValue(city);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
