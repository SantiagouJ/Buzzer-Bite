// importamos utilidades de servidor de nextjs y componentes base
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buzzerFetch, requireToken } from "../../../lib/buzzer-api";
import type { ApiOrder } from "../../../types/order";

// definimos las props para leer el tab activo desde la url
type OrdersPageProps = {
  searchParams: Promise<{ status?: string; readyId?: string }>;
};

// server action para marcar una orden como lista y pasarla a la pestana de listas
async function markOrderAsReady(formData: FormData) {
  "use server";

  // verificamos que exista la cookie de sesion
  await requireToken();

  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/restaurant/orders");

  // redirigimos a la pestana listas llevando el id de la orden marcada
  redirect(`/restaurant/orders?status=ready&readyId=${orderId}`);
}

// funcion auxiliar para formatear el precio en pesos colombianos
function formatPrice(value: number | string) {
  const numeric = Number(value ?? 0);
  return `$${numeric.toLocaleString("es-CO")}`;
}

// funcion auxiliar para formatear las horas de recogida
function formatPickupWindow(start?: string, end?: string) {
  if (!start || !end) return "Hoy";
  const formatHour = (timeStr: string) => {
    const hour = Number(String(timeStr).split(":")[0] ?? 0);
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };
  return `${formatHour(start)}-${formatHour(end)}`;
}

// componente asincrono que consulta las ordenes reales desde nestjs
async function OrdersContent({ searchParams }: OrdersPageProps) {
  // leemos si el usuario esta en la pestana pendiente o listas
  const { status, readyId } = await searchParams;
  const currentTab = status === "ready" ? "ready" : "pending";

  // pedimos el listado de ordenes al backend
  const response = await buzzerFetch("/orders");

  const data = response?.ok ? await response.json().catch(() => null) : null;
  const allOrders: ApiOrder[] | null = Array.isArray(data) ? data : null;

  // filtramos las ordenes reservadas pendientes de entrega en tienda
  const reservedOrders = allOrders
    ? allOrders.filter((order) => order.status === "RESERVED")
    : null;

  return (
    <>
      {/* pestanas superiores para alternar entre pendiente y listas */}
      <div
        role="tablist"
        aria-label="Filtrar órdenes por estado"
        className="flex items-start gap-2"
      >
        <Link
          href="/restaurant/orders?status=pending"
          role="tab"
          aria-selected={currentTab === "pending"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${currentTab === "pending"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
            }`}
        >
          Pendiente
        </Link>

        <Link
          href="/restaurant/orders?status=ready"
          role="tab"
          aria-selected={currentTab === "ready"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${currentTab === "ready"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
            }`}
        >
          Listas
        </Link>
      </div>

      {/* aviso cuando una orden se marca como lista para entregar */}
      {readyId && currentTab === "ready" && (
        <p className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
          Orden lista para entrega escanea el codigo del cliente
        </p>
      )}

      {/* mensajes de error o cuando no hay ordenes pendientes */}
      {reservedOrders === null && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          No se pudieron consultar las ordenes del servidor
        </p>
      )}

      {reservedOrders?.length === 0 && (
        <p className="text-[14px] font-normal leading-5 text-[#8e9892]">
          No hay ordenes activas por entregar en este momento
        </p>
      )}

      {/* tarjetas con los pedidos reales traidos de la api */}
      {reservedOrders && reservedOrders.length > 0 && (
        <section
          aria-label="Listado de órdenes"
          className="flex w-full flex-col items-start gap-3"
        >
          {reservedOrders.map((order) => {
            // armamos un codigo corto legible a partir del uuid de la orden
            const shortCode = `ORD-${order.id.slice(0, 4).toUpperCase()}`;
            const customerName = order.consumer?.full_name || "Cliente Buzzer";
            const windowText = formatPickupWindow(
              order.pack?.pickup_start,
              order.pack?.pickup_end,
            );

            return (
              <article
                key={order.id}
                className="flex w-full flex-col items-start gap-2 rounded-[22px] bg-[#1c211e] px-4 py-[14px]"
              >
                <p className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
                  {shortCode}
                </p>

                <div className="flex w-full items-start justify-between font-semibold whitespace-nowrap">
                  <h2 className="text-[16px] leading-[22px] tracking-[-0.1px] text-[#f3f6f4]">
                    {order.pack?.title || "Pack Sorpresa"}
                  </h2>
                  <p className="text-[15px] leading-5 text-[#2ee07a]">
                    {formatPrice(order.total_price)}
                  </p>
                </div>

                <p className="text-[13px] font-normal leading-[18px] text-[#8e9892]">
                  {customerName} · {windowText}
                </p>

                {currentTab === "pending" ? (
                  <form action={markOrderAsReady} className="w-full">
                    <input type="hidden" name="orderId" value={order.id} />
                    <button
                      type="submit"
                      className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
                    >
                      Marcar como lista
                    </button>
                  </form>
                ) : (
                  <Link
                    href={`/restaurant/orders/scan?orderId=${order.id}`}
                    className="flex w-full items-center justify-center gap-[10px] rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
                  >
                    <img src="/icons/scan.svg" alt="" width={24} height={24} />
                    <span>Escanear Código</span>
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

// pagina principal de ordenes del restaurante
export default function RestaurantOrdersPage({
  searchParams,
}: OrdersPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[84px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Ordenes
      </h1>

      <Suspense fallback={null}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}