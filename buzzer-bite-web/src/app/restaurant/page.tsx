// importamos utilidades de servidor de nextjs para cookies redireccion y cache
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buzzerFetch } from "../../lib/buzzer-api";
import { findOwnStore, requireMerchant } from "./session";

// arreglo fijo con las horas disponibles para los selectores de recogida
const PICKUP_HOURS = [
  { value: "12:00", label: "12 PM" },
  { value: "13:00", label: "1 PM" },
  { value: "14:00", label: "2 PM" },
  { value: "15:00", label: "3 PM" },
  { value: "16:00", label: "4 PM" },
  { value: "17:00", label: "5 PM" },
  { value: "18:00", label: "6 PM" },
  { value: "19:00", label: "7 PM" },
  { value: "20:00", label: "8 PM" },
  { value: "21:00", label: "9 PM" },
  { value: "22:00", label: "10 PM" },
  { value: "23:00", label: "11 PM" },
] as const;

// definimos los tipos de props para leer mensajes de error o exito desde la url
type DashboardPageProps = {
  searchParams: Promise<{ error?: string; created?: string; photo?: string; detail?: string }>;
};

function todayInBogota() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function readApiMessage(response: Response | null) {
  const data = await response?.json().catch(() => null);
  const message = data && typeof data === "object" ? (data as { message?: unknown }).message : null;
  const text = Array.isArray(message)
    ? message.filter((item): item is string => typeof item === "string").join(" ")
    : typeof message === "string"
      ? message
      : "";
  return text.replace(/\s+/g, " ").trim().slice(0, 240) || null;
}

// server action que se ejecuta en nextjs al enviar el formulario de crear pack
async function createPack(formData: FormData) {
  "use server";

  // leemos el token guardado en la cookie por el login de santiago
  const { token, userId } = await requireMerchant();

  // sacamos los valores que escribio el restaurante en el formulario
  const packType = String(formData.get("pack_type") ?? "Sorpresa");
  const rawPrice = String(formData.get("discount_price") ?? "0");
  // limpiamos signos de pesos y puntos para mandar un numero limpio al backend
  const discountPrice = Number(rawPrice.replace(/[^0-9]/g, ""));
  const stock = Number(formData.get("stock") ?? 1);
  const pickupStart = String(formData.get("pickup_start") ?? "17:00");
  const pickupEnd = String(formData.get("pickup_end") ?? "22:00");

  // validamos rapido que precio y stock sean numeros validos mayores a cero
  if (!discountPrice || discountPrice <= 0 || !stock || stock <= 0) {
    redirect("/restaurant?error=invalid");
  }

  const store = await findOwnStore(token, userId);
  const storeId = store?.id;
  if (!storeId) redirect("/restaurant?error=store");

  const image = await packPhoto(formData.get("image"));
  if (image === "invalid") {
    const params = new URLSearchParams({
      error: "api",
      detail: "La foto debe ser jpeg, png o webp y pesar menos de 5 MB",
    });
    redirect(`/restaurant?${params.toString()}`);
  }

  const body = new FormData();
  body.set("store_id", storeId);
  body.set("title", packType === "Sorpresa" ? "Pack Sorpresa" : "Pack Fijo");
  body.set("description", `Pack ${packType} disponible para retiro en tienda`);
  body.set("original_price", String(Math.round(discountPrice * 1.4)));
  body.set("discount_price", String(discountPrice));
  body.set("stock", String(stock));
  body.set("pickup_start", pickupStart);
  body.set("pickup_end", pickupEnd);
  body.set("pickup_date", todayInBogota());
  if (image) body.set("image", image.blob, image.name);

  // buzzerFetch manda a /login si el backend responde 401
  const response = await buzzerFetch("/packs", { method: "POST", body });

  // si falla la validacion o el servidor devolvio error avisamos en pantalla
  if (!response?.ok) {
    const detail = await readApiMessage(response);
    const params = new URLSearchParams({ error: "api" });
    if (detail) params.set("detail", detail);
    redirect(`/restaurant?${params.toString()}`);
  }

  // refrescamos la cache de packs y tablero y redirigimos al listado de packs
  revalidatePath("/restaurant");
  revalidatePath("/restaurant/packs");
  revalidatePath("/usuario/explorar");
  redirect("/restaurant/packs?created=1");
}

const PACK_IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function packPhoto(value: FormDataEntryValue | null) {
  if (!value || typeof value === "string" || typeof value.arrayBuffer !== "function" || value.size <= 0) {
    return undefined;
  }

  const name = "name" in value && typeof value.name === "string" ? value.name : "pack.jpg";
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const type = value.type === "image/jpg" ? "image/jpeg" : value.type || PACK_IMAGE_TYPES[extension];
  if (!type || !Object.values(PACK_IMAGE_TYPES).includes(type) || value.size > 5 * 1024 * 1024) {
    return "invalid";
  }

  return { blob: new Blob([await value.arrayBuffer()], { type }), name };
}

// componente de servidor principal del tablero del restaurante
export default async function RestaurantDashboardPage({
  searchParams,
}: DashboardPageProps) {
  // verificamos que exista la cookie de sesion antes de pedir datos
  const { token, userId } = await requireMerchant();
  const store = await findOwnStore(token, userId);

  // leemos los parametros de la url para mostrar alertas si hubo error
  const { error, photo, detail } = await searchParams;

  // consultamos los packs y las ordenes desde el backend en paralelo
  const [packsRes, ordersRes] = await Promise.all([
    buzzerFetch("/packs"),
    buzzerFetch("/orders"),
  ]);

  // convertimos las respuestas a arreglos seguros
  const packsData = packsRes?.ok ? await packsRes.json().catch(() => null) : null;
  const ordersData = ordersRes?.ok ? await ordersRes.json().catch(() => null) : null;

  const packs = (Array.isArray(packsData) ? packsData : []).filter(
    (pack: { store?: { id?: string } }) => pack.store?.id === store?.id,
  );
  const orders = Array.isArray(ordersData) ? ordersData : [];

  // calculamos las metricas reales usando filter y length como vimos en clase
  const activePacksCount = packs.filter(
    (pack: { status?: string; stock?: number }) =>
      pack.status === "AVAILABLE" || (pack.stock ?? 0) > 0
  ).length;

  const claimedOrders = orders.filter(
    (order: { status?: string }) => order.status === "CLAIMED"
  );
  const soldTodayCount = claimedOrders.length;

  // sumamos el total de dinero ganado en ordenes entregadas
  const totalEarnings = claimedOrders.reduce(
    (acc: number, order: { total_price?: number }) =>
      acc + Number(order.total_price ?? 0),
    0
  );
  // formateamos ganancias en miles por ejemplo 144k si es mayor a mil
  const formattedEarnings =
    totalEarnings >= 1000
      ? `$${Math.round(totalEarnings / 1000)}k`
      : `$${totalEarnings}`;

  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-4 px-5 pt-[84px] pb-28">
      {/* logo superior centrado */}
      <div className="flex h-12 w-full items-start justify-center">
        <img src="/brand/logo.svg" alt="" width={48} height={45.7019} />
      </div>

      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Tablero
      </h1>

      {/* mensajes de alerta si falla la creacion del pack */}
      {error === "invalid" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          Revisa que el precio y la cantidad sean mayores a cero
        </p>
      )}
      {error === "api" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          {detail || "No se pudo crear el pack verifica los datos o la conexion con el servidor"}
        </p>
      )}
      {error === "store" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          Termina el registro de tu cocina antes de publicar un pack
        </p>
      )}
      {photo === "1" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          La ubicación quedó guardada. La foto no se subió porque el almacenamiento de imágenes no está configurado en la API.
        </p>
      )}

      {/* fila con las 3 metricas calculadas desde la api */}
      <section
        aria-label="Métricas del restaurante"
        className="flex h-[68px] w-full items-start gap-[25px] whitespace-nowrap"
      >
        <div className="flex flex-col items-start gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-semibold leading-6 text-[#f3f6f4]">
            {activePacksCount}
          </p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Packs Activos
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-bold leading-6 text-[#f3f6f4]">
            {soldTodayCount}
          </p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Vendidos Hoy
          </p>
        </div>

        <div className="flex flex-col items-start justify-center gap-1 rounded-[18px] py-3">
          <p className="text-[20px] font-bold leading-6 text-[#2ee07a]">
            {formattedEarnings}
          </p>
          <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
            Ganancias
          </p>
        </div>
      </section>

      {/* formulario conectado a la server action createPack */}
      <form action={createPack} className="flex w-full flex-col items-start gap-[25px]">
        <div className="flex w-full flex-col items-start gap-[22px]">
          <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.1px] text-[#f3f6f4]">
            Nuevo pack
          </h2>

          {/* bloque para subir archivo de imagen */}
          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="image"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              IMAGEN
            </label>
            <label
              htmlFor="image"
              className="flex h-[196px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#1c211e] px-4 py-[14px]"
            >
              <img src="/icons/upload.svg" alt="" width={34} height={34} />
              <span className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
                SUBIR ARCHIVO
              </span>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
              />
            </label>
          </div>

          {/* selector radio entre pack sorpresa y pack fijo */}
          <fieldset className="flex w-full flex-col items-start gap-2">
            <legend className="mb-2 text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
              TIPO DE PAQUETE
            </legend>
            <div className="flex w-full items-start gap-2">
              <label className="flex w-1/2 cursor-pointer items-center justify-center rounded-full bg-[#1c211e] py-4 text-[16px] font-semibold leading-[22px] text-white has-[:checked]:bg-[#2ee07a] has-[:checked]:text-[#0b0d0c]">
                <input
                  type="radio"
                  name="pack_type"
                  value="Sorpresa"
                  defaultChecked
                  className="sr-only"
                />
                <span>Sorpresa</span>
              </label>

              <label className="flex w-1/2 cursor-pointer items-center justify-center rounded-full bg-[#1c211e] py-4 text-[16px] font-semibold leading-[22px] text-white has-[:checked]:bg-[#2ee07a] has-[:checked]:text-[#0b0d0c]">
                <input
                  type="radio"
                  name="pack_type"
                  value="Fijo"
                  className="sr-only"
                />
                <span>Fijo</span>
              </label>
            </div>
          </fieldset>

          {/* campo de precio en pesos colombianos */}
          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="discount_price"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              PRECIO (COP)
            </label>
            <input
              id="discount_price"
              name="discount_price"
              type="text"
              inputMode="numeric"
              defaultValue="$12.000"
              placeholder="$12.000"
              className="w-full rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#8e9892]"
            />
          </div>

          {/* control de cantidad disponible */}
          <div className="flex w-full flex-col items-start gap-2">
            <label
              htmlFor="stock"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              CANTIDAD
            </label>
            <div className="flex w-full items-center justify-between gap-[39px]">
              <button
                type="button"
                aria-label="Disminuir cantidad"
                className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
              >
                <img src="/icons/minus.svg" alt="" width={24} height={24} />
              </button>

              <input
                id="stock"
                name="stock"
                type="number"
                min={1}
                defaultValue={3}
                className="h-[50px] w-[173px] shrink-0 [appearance:textfield] rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-center text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />

              <button
                type="button"
                aria-label="Aumentar cantidad"
                className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[#f3f6f4] px-4 py-[14px]"
              >
                <img src="/icons/plus.svg" alt="" width={24} height={24} />
              </button>
            </div>
          </div>

          {/* selectores de hora de inicio y fin de recogida */}
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
              HORA DE RECOGIDA
            </span>
            <div className="flex h-[50px] w-full items-start justify-between gap-5">
              <div className="flex w-[170px] items-center gap-[10px] rounded-[18px] bg-[#1c211e] px-4 py-[14px]">
                <img
                  src="/icons/clock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <select
                  id="pickup_start"
                  name="pickup_start"
                  aria-label="Hora de inicio de recogida"
                  defaultValue="17:00"
                  className="w-full cursor-pointer appearance-none bg-transparent text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none"
                >
                  {PICKUP_HOURS.map((hour) => (
                    <option
                      key={hour.value}
                      value={hour.value}
                      className="bg-[#1c211e] text-[#f3f6f4]"
                    >
                      {hour.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-[170px] items-center gap-[10px] rounded-[18px] bg-[#1c211e] px-4 py-[14px]">
                <img
                  src="/icons/clock.svg"
                  alt=""
                  width={24}
                  height={24}
                  className="shrink-0"
                />
                <select
                  id="pickup_end"
                  name="pickup_end"
                  aria-label="Hora de fin de recogida"
                  defaultValue="22:00"
                  className="w-full cursor-pointer appearance-none bg-transparent text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none"
                >
                  {PICKUP_HOURS.map((hour) => (
                    <option
                      key={hour.value}
                      value={hour.value}
                      className="bg-[#1c211e] text-[#f3f6f4]"
                    >
                      {hour.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* boton principal para enviar el formulario */}
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
        >
          Crear Pack
        </button>
      </form>
    </main>
  );
}