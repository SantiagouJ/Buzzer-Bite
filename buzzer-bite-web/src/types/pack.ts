export type ApiPack = {
  id: string;
  title: string;
  description?: string | null;
  discount_price: number | string;
  stock: number;
  pickup_start: string;
  pickup_end: string;
  status: "AVAILABLE" | "SOLD_OUT" | "EXPIRED";
  image_url?: string | null;
  store?: {
    id: string;
    category?: string;
  };
};
