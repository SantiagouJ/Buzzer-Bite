import { Suspense } from "react";
import CustomerFavorites from "../../../components/customer-favorites";
import { requireConsumer } from "../session";

async function FavoritosGate() {
  const { userId, center } = await requireConsumer();

  return <CustomerFavorites userId={userId} latitude={center.latitude} longitude={center.longitude} />;
}

export default function FavoritosPage() {
  return (
    <main className="min-h-dvh">
      <Suspense
        fallback={
          <p className="px-5 pt-6 text-[15px] leading-[22px] text-[#8e9892]">Cargando tus favoritos...</p>
        }
      >
        <FavoritosGate />
      </Suspense>
    </main>
  );
}
