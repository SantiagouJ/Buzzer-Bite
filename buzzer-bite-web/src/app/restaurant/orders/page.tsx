import Link from "next/link";
import { Suspense } from "react";

type OrderItem = {
  id: string;
  code: string;
  packTitle: string;
  price: string;
  customerAndTime: string;
};

const SAMPLE_ORDERS: OrderItem[] = [
  {
    id: "order-2401",
    code: "ORD-2401",
    packTitle: "Crunchy Chicken",
    price: "$20.000",
    customerAndTime: "María García · 12–5 PM",
  },
  {
    id: "order-2205",
    code: "ORD-2205",
    packTitle: "Golden Bucket",
    price: "$14.000",
    customerAndTime: "Sebastián Ortiz · 12–5 PM",
  },
];

type OrdersPageProps = {
  searchParams: Promise<{ status?: string }>;
};

async function OrdersContent({ searchParams }: OrdersPageProps) {
  const { status } = await searchParams;
  const currentTab = status === "ready" ? "ready" : "pending";

  return (
    <>
      <div
        role="tablist"
        aria-label="Filtrar órdenes por estado"
        className="flex items-start gap-2"
      >
        <Link
          href="/restaurant/orders?status=pending"
          role="tab"
          aria-selected={currentTab === "pending"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${
            currentTab === "pending"
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
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${
            currentTab === "ready"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
          }`}
        >
          Listas
        </Link>
      </div>

      <section
        aria-label="Listado de órdenes"
        className="flex w-full flex-col items-start gap-3"
      >
        {SAMPLE_ORDERS.map((order) => (
          <article
            key={order.id}
            className="flex w-full flex-col items-start gap-2 rounded-[22px] bg-[#1c211e] px-4 py-[14px]"
          >
            <p className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]">
              {order.code}
            </p>

            <div className="flex w-full items-start justify-between font-semibold whitespace-nowrap">
              <h2 className="text-[16px] leading-[22px] tracking-[-0.1px] text-[#f3f6f4]">
                {order.packTitle}
              </h2>
              <p className="text-[15px] leading-5 text-[#2ee07a]">
                {order.price}
              </p>
            </div>

            <p className="text-[13px] font-normal leading-[18px] text-[#8e9892]">
              {order.customerAndTime}
            </p>

            {currentTab === "pending" ? (
              <form className="w-full">
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
        ))}
      </section>
    </>
  );
}

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
