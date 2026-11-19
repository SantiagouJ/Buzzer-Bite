"use server";

import { redirect } from "next/navigation";
import { buzzerFetch, requireToken } from "../../../../lib/buzzer-api";
import { getCurrentUser } from "../../../../lib/roles";

export async function saveKitchen(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));

  const back = new URLSearchParams({ name, category, city });
  const fail = (detail?: string | null): never => {
    if (detail) back.set("detail", detail.slice(0, 240));
    back.set("error", "1");
    redirect(`/register/comercio/mapa?${back.toString()}`);
  };

  if (!name || !category || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    fail();
  }

  const token = await requireToken();

  const image = await storePhoto(formData.get("image"));

  const user = await getCurrentUser(token);
  if (!user) redirect("/login");

  const storesResponse = await buzzerFetch("/stores");
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

  const response = await buzzerFetch(current?.id ? `/stores/${current.id}` : "/stores", {
    method: current?.id ? "PATCH" : "POST",
    body,
  });

  if (!response || !response.ok) {
    const detail = await readApiMessage(response);
    if (detail) back.set("detail", detail.slice(0, 240));
    back.set("error", "1");
    redirect(`/register/comercio/mapa?${back.toString()}`);
  }

  const saved = await response.json().catch(() => null);
  const storeId = current?.id ?? (typeof saved?.id === "string" ? saved.id : "");

  if (image === "invalid") redirect("/restaurant?photo=1");
  if (image && storeId) {
    const photoBody = new FormData();
    photoBody.set("image", image.blob, image.name);
    const photoResponse = await buzzerFetch(`/stores/${storeId}`, {
      method: "PATCH",
      body: photoBody,
    });
    if (!photoResponse?.ok) redirect("/restaurant?photo=1");
  }

  redirect("/restaurant");
}

async function readApiMessage(response: Response | null) {
  const data = await response?.json().catch(() => null);
  const message = data && typeof data === "object" ? (data as { message?: unknown }).message : null;
  const text = Array.isArray(message)
    ? message.filter((item): item is string => typeof item === "string").join(" ")
    : typeof message === "string"
      ? message
      : "";
  return text.replace(/\s+/g, " ").trim() || null;
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
