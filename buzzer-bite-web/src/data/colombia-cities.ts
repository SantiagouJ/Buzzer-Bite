export const COLOMBIA_CITIES = ["Cali", "Bogotá", "Medellín"] as const;

export function normalizeCity(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function canonicalCity(value: string) {
  const normalized = normalizeCity(value);
  return COLOMBIA_CITIES.find((city) => normalizeCity(city) === normalized) ?? null;
}
