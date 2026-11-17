"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function saveKitchen(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  const back = new URLSearchParams({ name, category, city });
  const fail = () => redirect(`/register/comercio/mapa?${back.toString()}&error=1`);

  if (!name || !category || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    fail();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const image = await storePhoto(formData.get("image"));
  if (image === "invalid") fail();

  const me = await fetch(`${process.env.BUZZER_BITE_API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!me?.ok) redirect("/login");
  const user = await me.json().catch(() => null);
  if (typeof user?.id !== "string") redirect("/login");

  const storesResponse = await fetch(`${process.env.BUZZER_BITE_API_URL}/stores`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  const stores = storesResponse?.ok ? await storesResponse.json().catch(() => null) : null;
  const current = Array.isArray(stores)
    ? stores.find((store) => store?.user?.id === user.id)
    : null;

  const body = new FormData();
  body.set("name", name);
  body.set("category", category);
  body.set("address", address);
  body.set("latitude", String(latitude));
  body.set("longitude", String(longitude));
  if (!current?.id) body.set("user_id", user.id);
  if (image && image !== "invalid") body.set("image", image.blob, image.name);

  const response = await fetch(
    current?.id
      ? `${process.env.BUZZER_BITE_API_URL}/stores/${current.id}`
      : `${process.env.BUZZER_BITE_API_URL}/stores`,
    {
      method: current?.id ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    },
  ).catch(() => null);

  if (!response?.ok) fail();
  redirect("/restaurant");
}

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function storePhoto(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string" || typeof value.arrayBuffer !== "function" || value.size <= 0) {
    return undefined;
  }

  const name = "name" in value && typeof value.name === "string" ? value.name : "photo.jpg";
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const type = value.type === "image/jpg" ? "image/jpeg" : value.type || IMAGE_TYPES[extension];
  if (!type || !Object.values(IMAGE_TYPES).includes(type) || value.size > 5 * 1024 * 1024) return "invalid";

  return { blob: new Blob([await value.arrayBuffer()], { type }), name };
}
