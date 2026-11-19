import { Suspense } from "react";
import CustomerHome from "../../../components/customer-home";
import { requireConsumer } from "../session";

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] ?? "";
}

async function InicioGate() {
  const { userId, fullName, center } = await requireConsumer();

  return (
    <CustomerHome
      name={firstName(fullName)}
      userId={userId}
      latitude={center.latitude}
      longitude={center.longitude}
    />
  );
}

export default function InicioPage() {
  return (
    <main className="min-h-dvh">
      <Suspense
        fallback={
          <p className="px-5 pt-6 text-[15px] leading-[22px] text-[#8e9892]">Cargando tu inicio...</p>
        }
      >
        <InicioGate />
      </Suspense>
    </main>
  );
}
