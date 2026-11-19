// importamos utilidades de servidor de nextjs para redireccion
import { redirect } from "next/navigation";
import ProfileCard from "../../../components/profile-card";
import { logout } from "../../logout-action";
import { findOwnStore, requireMerchant } from "../session";

// pagina principal del perfil del restaurante
export default async function RestaurantProfilePage() {
  // leemos el token guardado en la cookie coffee_token
  const { token, userId } = await requireMerchant();

  const [store, packsRes, ordersRes] = await Promise.all([
    findOwnStore(token, userId),
    fetch(`${process.env.BUZZER_BITE_API_URL}/packs`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
    fetch(`${process.env.BUZZER_BITE_API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => null),
  ]);

  if (packsRes?.status === 401 || ordersRes?.status === 401) {
    redirect("/login");
  }

  const packsData = packsRes?.ok ? await packsRes.json().catch(() => null) : null;
  const ordersData = ordersRes?.ok ? await ordersRes.json().catch(() => null) : null;

  const packs = (Array.isArray(packsData) ? packsData : []).filter(
    (pack: { store?: { id?: string } }) => pack.store?.id === store?.id,
  );
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const storeName = store?.name || "Mi Restaurante";
  const storeAddress = store?.address || "Cali, Colombia";
  const storeAvatar = store?.image_url || "/images/store-avatar.png";

  // calculamos las metricas reales del comercio
  const activePacksCount = packs.filter(
    (pack: { status?: string; stock?: number }) =>
      pack.status === "AVAILABLE" || (pack.stock ?? 0) > 0,
  ).length;

  const claimedOrders = orders.filter(
    (order: { status?: string }) => order.status === "CLAIMED",
  );
  const soldTodayCount = claimedOrders.length;

  const totalEarnings = claimedOrders.reduce(
    (acc: number, order: { total_price?: number }) =>
      acc + Number(order.total_price ?? 0),
    0,
  );
  const formattedEarnings =
    totalEarnings >= 1000
      ? `$${Math.round(totalEarnings / 1000)}k`
      : `$${totalEarnings}`;

  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[64px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Perfil
      </h1>

      {/* tarjeta superior con banner y datos del restaurante */}
      <ProfileCard
        label="Información del restaurante"
        title={storeName}
        subtitle={storeAddress}
        banner="/images/profile-banner-gradient.png"
        avatar={{ src: storeAvatar, alt: storeName }}
      />

      {/* fila de metricas reales del comercio */}
      <section
        aria-label="Métricas del restaurante"
        className="flex h-[68px] w-full items-start gap-[25px] px-[9px] whitespace-nowrap"
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

      {/* interruptor de estado de la tienda */}
      <div className="flex w-full items-center justify-between rounded-[18px] bg-[#1c211e] py-3 pr-3 pl-4">
        <label
          htmlFor="store_open"
          className="cursor-pointer text-[15px] font-semibold leading-5 text-[#f3f6f4]"
        >
          Store open
        </label>

        <label
          htmlFor="store_open"
          className="relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center"
        >
          <input
            id="store_open"
            name="store_open"
            type="checkbox"
            defaultChecked
            className="peer sr-only"
          />
          <img
            src="/icons/toggle-on.svg"
            alt="Store open"
            width={44}
            height={26}
            className="block peer-not-checked:opacity-40"
          />
        </label>
      </div>

      {/* boton de cierre de sesion conectado a la server action logout */}
      <form action={logout} className="w-full">
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full border border-[#29332e] bg-[#1c211e] py-[15px] text-[15px] font-semibold leading-[22px] text-[#ff8f8f]"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}