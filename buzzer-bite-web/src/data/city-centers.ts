import { COLOMBIA_CITIES } from "./colombia-cities";

export const CITY_CENTERS: Record<
  (typeof COLOMBIA_CITIES)[number],
  { latitude: number; longitude: number }
> = {
  Cali: { latitude: 3.4516, longitude: -76.532 },
  Bogotá: { latitude: 4.711, longitude: -74.0721 },
  Medellín: { latitude: 6.2442, longitude: -75.5812 },
};
