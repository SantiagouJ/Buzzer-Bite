export type ApiOrder = {
  id: string;
  quantity: number;
  total_price: number | string;
  verification_code: string;
  status: "RESERVED" | "CLAIMED" | "EXPIRED";
  created_at: string;
  consumer?: {
    id: string;
    full_name?: string;
    email?: string;
  };
  pack?: {
    id: string;
    title: string;
    pickup_start?: string;
    pickup_end?: string;
    store_id?: string;
  };
};
