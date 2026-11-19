import { Suspense } from "react";
import CustomerTabBar from "../../../components/customer-tab-bar";
import ProfileCard from "../../../components/profile-card";
import { logout } from "../../logout-action";
import { buzzerFetch } from "../../../lib/buzzer-api";
import { requireConsumer } from "../session";

const RECENT_LIMIT = 5;

const statusLabels: Record<string, string> = {
  RESERVED: "Reservada",
  CLAIMED: "Completada",
  CANCELLED: "Cancelada",
  EXPIRED: "Vencida",
};

type Order = {
  id: string;
  status: string;
  quantity: number;
  createdAt: string;
  packId: string | null;
  packTitle: string;
  originalPrice: number;
  discountPrice: number;
  consumerName: string;
};

function record(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readOrders(data: unknown): Order[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const order = record(item);
    if (!order || typeof order.id !== "string") return [];
    const pack = record(order.pack);
    const consumer = record(order.consumer);
    return [
      {
        id: order.id,
        status: typeof order.status === "string" ? order.status : "",
        quantity: Number(order.quantity) || 1,
        createdAt: typeof order.created_at === "string" ? order.created_at : "",
        packId: typeof pack?.id === "string" ? pack.id : null,
        packTitle: typeof pack?.title === "string" ? pack.title : "Pack",
        originalPrice: Number(pack?.original_price) || 0,
        discountPrice: Number(pack?.discount_price) || 0,
        consumerName: typeof consumer?.full_name === "string" ? consumer.full_name.trim() : "",
      },
    ];
  });
}

function storeNamesByPack(data: unknown) {
  const names = new Map<string, string>();
  if (!Array.isArray(data)) return names;
  for (const item of data) {
    const pack = record(item);
    const store = record(pack?.store);
    if (typeof pack?.id === "string" && typeof store?.name === "string") names.set(pack.id, store.name);
  }
  return names;
}

function formatSaved(amount: number) {
  return amount >= 1000 ? `$${Math.round(amount / 1000)}k` : `$${Math.round(amount)}`;
}

function formatDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = (parts.find((part) => part.type === "month")?.value ?? "").replace(".", "");
  return `${day} ${month.charAt(0).toLocaleUpperCase("es") + month.slice(1)}`;
}

async function PerfilContent() {
  const { email, homeCity: city } = await requireConsumer();

  const [ordersRes, packsRes, favoritesRes] = await Promise.all([
    buzzerFetch("/orders"),
    buzzerFetch("/packs"),
    buzzerFetch("/favorites"),
  ]);

  const orders = readOrders(ordersRes?.ok ? await ordersRes.json().catch(() => null) : null);
  const storeNames = storeNamesByPack(packsRes?.ok ? await packsRes.json().catch(() => null) : null);
  const favoritesData = favoritesRes?.ok ? await favoritesRes.json().catch(() => null) : null;
  const favoritesCount = Array.isArray(favoritesData) ? favoritesData.length : 0;

  const name = orders.find((order) => order.consumerName)?.consumerName || email;
  const saved = orders
    .filter((order) => order.status === "CLAIMED")
    .reduce(
      (sum, order) => sum + Math.max(order.originalPrice - order.discountPrice, 0) * order.quantity,
      0,
    );
  const recent = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_LIMIT);

  const stats = [
    { label: "Reservas", value: String(orders.length), className: "text-[#f3f6f4]" },
    { label: "Favoritos", value: String(favoritesCount), className: "text-[#f3f6f4]" },
    { label: "Ahorrado", value: formatSaved(saved), className: "text-[#2ee07a]" },
  ];

  return (
    <>
      <ProfileCard
        label="Información del usuario"
        title={name}
        subtitle={city ? `${city}, Colombia` : "Colombia"}
        banner="/images/customer-banner-gradient.png"
      >
        <dl className="flex w-full items-start gap-[25px] whitespace-nowrap">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1 py-3">
              <dt className="text-[12px] leading-4 font-normal text-[#8e9892]">{stat.label}</dt>
              <dd className={`text-[20px] leading-6 font-semibold ${stat.className}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </ProfileCard>

      <h2 className="text-[18px] leading-6 font-semibold tracking-[-0.1px] text-[#f3f6f4]">
        Reservas recientes
      </h2>

      {recent.length === 0 ? (
        <p className="text-[13px] leading-[18px] text-[#8e9892]">Aún no tienes reservas.</p>
      ) : (
        <ul className="flex w-full flex-col gap-4">
          {recent.map((order) => (
            <li
              key={order.id}
              className="flex w-full flex-col gap-[2px] rounded-[18px] bg-[#1c211e] px-4 py-[14px]"
            >
              <p className="text-[16px] leading-[22px] font-semibold text-[#f3f6f4]">
                {(order.packId && storeNames.get(order.packId)) || order.packTitle}
              </p>
              <p className="text-[13px] leading-[18px] font-normal text-[#8e9892]">
                {[formatDay(order.createdAt), statusLabels[order.status] ?? order.status]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form action={logout} className="w-full">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full border border-[#29332e] bg-[#1c211e] py-[15px] text-[15px] font-semibold leading-[22px] text-[#ff8f8f]"
        >
          Cerrar sesión
        </button>
      </form>
    </>
  );
}

export default function PerfilPage() {
  return (
    <main className="min-h-dvh">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[396px] flex-col items-start gap-4 px-5 pt-6 pb-28">
        <h1 className="w-full text-[26px] leading-8 font-bold tracking-[-0.3px] text-[#f3f6f4]">Perfil</h1>
        <Suspense
          fallback={<p className="text-[15px] leading-[22px] text-[#8e9892]">Cargando tu perfil...</p>}
        >
          <PerfilContent />
        </Suspense>
      </div>

      <CustomerTabBar
        current="perfil"
        className="fixed bottom-5 left-1/2 w-[min(360px,calc(100%-40px))] -translate-x-1/2"
      />
    </main>
  );
}
