export type UserRole = "merchant" | "consumer";

export type CurrentUser = {
  id: string;
  email?: string;
  full_name?: string;
  location?: string;
  role?: string;
};
