// importamos utilidades de servidor de nextjs y el contador cliente
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PackStockStepper from "../../../../components/pack-stock-stepper";

// definimos las props con el parametro dinamico id de la carpeta [id]
type EditPackPageProps = {
  params: Promise<{ id: string }>;
};

// server action que maneja tanto guardar el stock como borrar el pack
async function updateOrDeletePack(formData: FormData) {
  "use server";

  // leemos el token guardado en la cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const packId = String(formData.get("pack_id") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  const stock = Number(formData.get("stock") ?? 0);

  if (!packId) redirect("/restaurant/packs");

  // si el usuario presiono borrar pack lo marcamos como expirado y stock cero
  // si presiono guardar actualizamos el stock y el estado segun la cantidad
  const payload =
    intent === "delete"
      ? { status: "EXPIRED", stock: 0 }
      : {
        stock: Math.max(0, stock),
        status: stock > 0 ? "AVAILABLE" : "SOLD_OUT",
      };

  // enviamos la peticion patch al endpoint update del backend
  const response = await fetch(
    `${process.env.BUZZER_BITE_API_URL}/packs/${packId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  // refrescamos las vistas afectadas y volvemos al listado de packs
  revalidatePath("/restaurant/packs");
  revalidatePath("/restaurant");
  redirect("/restaurant/packs?updated=1");
}

// funcion auxiliar para formatear el precio en pesos colombianos
function formatPrice(value: number | string) {
  const numeric = Number(value ?? 0);
  return `$${numeric.toLocaleString("es-CO")}`;
}

// funcion auxiliar para formatear la ventana horaria
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

// componente asincrono que consulta el detalle real del pack por id
async function EditPackDetail({ params }: EditPackPageProps) {
  // resolvemos el parametro dinamico de la url
  const { id } = await params;

  // leemos la cookie de sesion
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  // consultamos el pack especifico en nestjs
  const response = await fetch(
    `${process.env.BUZZER_BITE_API_URL}/packs/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");
  if (!response?.ok) redirect("/restaurant/packs");

  const pack = await response.json().catch(() => null);
  if (!pack) redirect("/restaurant/packs");

  const currentStock = Number(pack.stock ?? 0);
  const totalBase = Math.max(currentStock, 6);
  const progressPercent = Math.min(
    100,
    Math.round((currentStock / totalBase) * 100),
  );

  return (
    <section
      aria-label="Detalle del pack"
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

      <div className="flex w-full flex-col items-start gap-[35px] px-4 pb-4">
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full flex-col items-start gap-[2px]">
            <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f0f3f1]">
              {pack.title}
            </h2>
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
                {currentStock} Restantes
              </span>
            </div>
          </div>

          <div
            role="progressbar"
            aria-valuenow={currentStock}
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

        {/* formulario conectado a la server action de guardar o borrar */}
        <form
          action={updateOrDeletePack}
          className="flex w-full flex-col items-start gap-[35px]"
        >
          <input type="hidden" name="pack_id" value={pack.id} />

          {/* contador cliente inicializado con el stock real de la base de datos */}
          <PackStockStepper initialStock={currentStock} />

          <div className="flex w-full flex-col items-start gap-[15px]">
            <button
              type="submit"
              name="intent"
              value="delete"
              className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#fb523f] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
            >
              Borrar Pack
            </button>

            <button
              type="submit"
              name="intent"
              value="save"
              className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

// pagina principal de edicion de pack
export default function EditPackPage({ params }: EditPackPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-5 px-[22px] pt-[84px] pb-28">
      <Link
        href="/restaurant/packs"
        className="flex items-center justify-center gap-2 text-[16px] font-medium leading-4 tracking-[0.35px] text-[#f0f3f1]"
      >
        <img src="/icons/back-circle.svg" alt="" width={24} height={24} />
        <span>Back</span>
      </Link>

      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Editar Pack
      </h1>

      <Suspense fallback={null}>
        <EditPackDetail params={params} />
      </Suspense>
    </main>
  );
}