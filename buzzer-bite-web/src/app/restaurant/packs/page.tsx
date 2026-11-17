// importamos utilidades de servidor de nextjs y componentes base
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// definimos la estructura que devuelve el backend para cada pack
type ApiPack = {
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

// definimos los parametros que llegan por la url
type PacksPageProps = {
  searchParams: Promise<{ status?: string; created?: string; updated?: string }>;
};

// server action para desactivar o borrar un pack desde el icono de basura
async function deletePack(formData: FormData) {
  "use server";

  // leemos el token de sesion desde la cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const packId = String(formData.get("packId") ?? "");
  if (!packId) return;

  // enviamos patch marcando el pack como expirado y stock en cero
  const response = await fetch(
    `${process.env.BUZZER_BITE_API_URL}/packs/${packId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "EXPIRED", stock: 0 }),
    },
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  // refrescamos las pantallas de packs y tablero
  revalidatePath("/restaurant/packs");
  revalidatePath("/restaurant");
}

// funcion auxiliar para formatear el precio en pesos colombianos
function formatPrice(value: number | string) {
  const numeric = Number(value ?? 0);
  return `$${numeric.toLocaleString("es-CO")}`;
}

// funcion auxiliar para formatear las horas de recogida tipo 2-7 PM
function formatPickupWindow(start: string, end: string) {
  const formatHour = (timeStr: string) => {
    const hour = Number(String(timeStr).split(":")[0] ?? 0);
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };
  return `${formatHour(start)}-${formatHour(end)}`;
}

// componente asincrono que consulta la api y dibuja las pestanas y tarjetas
async function PacksContent({ searchParams }: PacksPageProps) {
  // verificamos la sesion con la cookie coffee_token
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  // leemos el filtro de estado y avisos desde la url
  const { status, created, updated } = await searchParams;
  const currentStatus = status === "SOLD_OUT" ? "SOLD_OUT" : "AVAILABLE";

  // consultamos primero la tienda del comerciante para filtrar solo sus packs
  const storeRes = await fetch(`${process.env.BUZZER_BITE_API_URL}/stores/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (storeRes?.status === 401) redirect("/login");

  const storeData = storeRes?.ok ? await storeRes.json().catch(() => null) : null;
  const storeId = storeData?.id;

  // armamos la ruta de consulta de packs filtrada por tienda si existe storeId
  const packsEndpoint = storeId
    ? `/packs/search?store_id=${storeId}&status=${currentStatus}&limit=50`
    : `/packs/search?status=${currentStatus}&limit=50`;

  const response = await fetch(
    `${process.env.BUZZER_BITE_API_URL}${packsEndpoint}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  const data = response?.ok ? await response.json().catch(() => null) : null;
  const visiblePacks: ApiPack[] | null = Array.isArray(data) ? data : null;

  return (
    <>
      {/* mensajes de confirmacion cuando se crea o edita un pack */}
      {created === "1" && (
        <p className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
          Pack creado y publicado correctamente
        </p>
      )}
      {updated === "1" && (
        <p className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
          Cambios guardados en el pack
        </p>
      )}

      {/* pestanas superiores para cambiar entre activos y agotados */}
      <div
        role="tablist"
        aria-label="Filtrar packs por estado"
        className="flex items-start gap-2"
      >
        <Link
          href="/restaurant/packs?status=AVAILABLE"
          role="tab"
          aria-selected={currentStatus === "AVAILABLE"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${currentStatus === "AVAILABLE"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
            }`}
        >
          Activos
        </Link>

        <Link
          href="/restaurant/packs?status=SOLD_OUT"
          role="tab"
          aria-selected={currentStatus === "SOLD_OUT"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${currentStatus === "SOLD_OUT"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
            }`}
        >
          Agotados
        </Link>
      </div>

      {/* mensajes de error o lista vacia */}
      {visiblePacks === null && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          No se pudieron consultar los packs del servidor
        </p>
      )}

      {visiblePacks?.length === 0 && (
        <p className="text-[14px] font-normal leading-5 text-[#8e9892]">
          No hay packs en esta categoria todavia
        </p>
      )}

      {/* listado de tarjetas con los packs reales de la api */}
      {visiblePacks && visiblePacks.length > 0 && (
        <section
          aria-label="Listado de packs"
          className="flex w-full flex-col items-start gap-3"
        >
          {visiblePacks.map((pack) => {
            // calculamos un porcentaje visual para la barra de inventario
            const totalBase = Math.max(pack.stock, 6);
            const progressPercent = Math.min(
              100,
              Math.round((pack.stock / totalBase) * 100),
            );

            return (
              <article
                key={pack.id}
                className="relative flex w-full flex-col items-start gap-[19px] overflow-hidden rounded-[20px] bg-[#1c211e]"
              >
                <div className="relative h-[112px] w-full shrink-0">
                  <img
                    src={pack.image_url || "/images/pack-sample.png"}
                    alt={pack.title}
                    className="size-full object-cover"
                  />
                  <span className="absolute top-3 left-3 flex items-center rounded-full bg-[#f3f6f4] px-[9.37px] py-[5.35px] text-[8.7px] font-semibold leading-[10.7px] text-[#0b0d0c]">
                    {pack.store?.category || "Antojos"}
                  </span>
                </div>

                <div className="flex w-full flex-col items-start gap-4 px-4 pb-4">
                  <div className="flex w-full flex-col items-start gap-[2px]">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-[10px]">
                        <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f0f3f1]">
                          {pack.title}
                        </h2>
                        {/* enlace dinamico hacia la vista de editar pack con su id */}
                        <Link
                          href={`/restaurant/packs/${pack.id}`}
                          aria-label={`Editar ${pack.title}`}
                          className="flex size-5 shrink-0 items-center justify-center"
                        >
                          <img
                            src="/icons/edit.svg"
                            alt=""
                            width={20}
                            height={20}
                          />
                        </Link>
                      </div>

                      {/* formulario pequeno para borrar o desactivar el pack */}
                      <form action={deletePack}>
                        <input type="hidden" name="packId" value={pack.id} />
                        <button
                          type="submit"
                          aria-label={`Eliminar ${pack.title}`}
                          className="flex size-5 shrink-0 cursor-pointer items-center justify-center"
                        >
                          <img
                            src="/icons/trash.svg"
                            alt=""
                            width={20}
                            height={20}
                          />
                        </button>
                      </form>
                    </div>

                    <p className="text-[13px] font-medium leading-[18px] text-[#2ee07a]">
                      {formatPrice(pack.discount_price)}
                    </p>
                  </div>

                  <div className="flex w-full items-start justify-between">
                    <div className="flex items-center gap-1">
                      <img
                        src="/icons/clock-sm.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="shrink-0"
                      />
                      <span className="text-[12px] font-normal leading-4 text-[#8a948d]">
                        {formatPickupWindow(pack.pickup_start, pack.pickup_end)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <img
                        src="/icons/bag-sm.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="shrink-0"
                      />
                      <span className="text-[12px] font-normal leading-4 text-[#8a948d]">
                        {pack.stock} restantes
                      </span>
                    </div>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={pack.stock}
                    aria-valuemin={0}
                    aria-valuemax={totalBase}
                    className="relative h-[6px] w-full overflow-hidden rounded-[99px] bg-[#292e2a]"
                  >
                    <div
                      className="h-[6px] rounded-[99px] bg-[#2ee07a]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// componente pagina principal de packs
export default function RestaurantPacksPage({ searchParams }: PacksPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[84px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Packs
      </h1>

      <Suspense fallback={null}>
        <PacksContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}