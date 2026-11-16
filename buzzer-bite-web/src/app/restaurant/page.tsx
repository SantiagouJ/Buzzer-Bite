// importamos utilidades de servidor de nextjs para cookies redireccion y cache
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  searchParams: Promise<{ error?: string; created?: string }>;
};

// server action que se ejecuta en nextjs al enviar el formulario de crear pack
async function createPack(formData: FormData) {
  "use server";

  // leemos el token guardado en la cookie por el login de santiago
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

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

  // consultamos primero la tienda asociada al comerciante autenticado
  const storeRes = await fetch(`${process.env.BUZZER_BITE_API_URL}/stores/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  // si el token vencio mandamos al login
  if (storeRes?.status === 401) redirect("/login");

  const storeData = storeRes?.ok ? await storeRes.json().catch(() => null) : null;
  const storeId = storeData?.id;

  // construimos el objeto con los campos que espera el dto de nestjs
  const payload = {
    store_id: storeId,
    title: packType === "Sorpresa" ? "Pack Sorpresa" : "Pack Fijo",
    description: `Pack ${packType} disponible para retiro en tienda`,
    original_price: Math.round(discountPrice * 1.4),
    discount_price: discountPrice,
    stock: stock,
    pickup_start: pickupStart,
    pickup_end: pickupEnd,
  };

  // enviamos la peticion post al endpoint de packs en nestjs
  const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/packs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => null);

  // si el backend responde 401 lo mandamos a iniciar sesion
  if (response?.status === 401) redirect("/login");

  // si falla la validacion o el servidor devolvio error avisamos en pantalla
  if (!response?.ok) {
    redirect("/restaurant?error=api");
  }

  // refrescamos la cache de packs y tablero y redirigimos al listado de packs
  revalidatePath("/restaurant");
  revalidatePath("/restaurant/packs");
  redirect("/restaurant/packs?created=1");
}

// componente de servidor principal del tablero del restaurante
export default async function RestaurantDashboardPage({
  searchParams,
}: DashboardPageProps) {
  // verificamos que exista la cookie de sesion antes de pedir datos
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  // leemos los parametros de la url para mostrar alertas si hubo error
  const { error } = await searchParams;

  // consultamos los packs y las ordenes desde el backend en paralelo
  const [packsRes, ordersRes] = await Promise.all([
    fetch(`${process.env.BUZZER_BITE_API_URL}/packs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
    fetch(`${process.env.BUZZER_BITE_API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
  ]);

  // si alguno responde 401 la sesion expiro y redirigimos al login
  if (packsRes?.status === 401 || ordersRes?.status === 401) {
    redirect("/login");
  }

  // convertimos las respuestas a arreglos seguros
  const packsData = packsRes?.ok ? await packsRes.json().catch(() => null) : null;
  const ordersData = ordersRes?.ok ? await ordersRes.json().catch(() => null) : null;

  const packs = Array.isArray(packsData) ? packsData : [];
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
          No se pudo crear el pack verifica los datos o la conexion con el servidor
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