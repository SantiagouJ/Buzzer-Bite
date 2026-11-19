// importamos utilidades de servidor de nextjs y componentes base
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { buzzerFetch } from "../../../../lib/buzzer-api";

// definimos las props para leer el orderId entregado desde la url
type PickedUpPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

// funcion auxiliar para formatear el precio en pesos colombianos
function formatPrice(value: number | string) {
  const numeric = Number(value ?? 0);
  return `$${numeric.toLocaleString("es-CO")}`;
}

// componente asincrono que consulta el resumen real de la orden entregada
async function PickedUpSummary({ searchParams }: PickedUpPageProps) {
  const { orderId } = await searchParams;
  if (!orderId) redirect("/restaurant/orders");

  // consultamos el detalle de la orden canjeada en nestjs
  const response = await buzzerFetch(`/orders/${orderId}`);

  const order = response?.ok ? await response.json().catch(() => null) : null;

  // preparamos los textos a mostrar con respaldo seguro
  const displayCode = order?.verification_code
    ? `CR-${String(order.verification_code).slice(0, 4).toUpperCase()}`
    : "CR-OK";
  const customerName = order?.consumer?.full_name || "Cliente Buzzer";
  const packTitle = order?.pack?.title || "Pack Sorpresa";
  const priceText = order?.total_price ? formatPrice(order.total_price) : "";

  return (
    <section
      aria-label="Resumen de orden entregada"
      className="flex w-full flex-col items-center gap-[10px] rounded-[22px] bg-[#161a18] p-[18px] whitespace-nowrap"
    >
      <p className="text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        {displayCode}
      </p>
      <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f3f6f4]">
        {customerName}
      </p>
      <p className="text-[15px] font-normal leading-[22px] text-[#8e9892]">
        {packTitle} {priceText ? `· ${priceText}` : ""}
      </p>
    </section>
  );
}

// pagina principal de confirmacion de entrega
export default function OrderPickedUpPage({ searchParams }: PickedUpPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[84px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Picked up
      </h1>

      <p className="w-full text-[15px] font-normal leading-[22px] text-[#8e9892]">
        El código coincidió. El pack ya salió.
      </p>

      <Suspense fallback={null}>
        <PickedUpSummary searchParams={searchParams} />
      </Suspense>

      <Link
        href="/restaurant/orders"
        className="flex w-full items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
      >
        Volver a Ordenes
      </Link>
    </main>
  );
}