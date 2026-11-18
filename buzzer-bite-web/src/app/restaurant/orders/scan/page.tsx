// importamos utilidades de servidor de nextjs y componentes base
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// definimos las props para recibir el orderId y posibles errores desde la url
type ScanOrderQrPageProps = {
  searchParams: Promise<{ orderId?: string; error?: string }>;
};

// server action que valida el codigo qr contra el endpoint claim de nestjs
async function claimOrder(formData: FormData) {
  "use server";

  // leemos el token guardado en la cookie coffee_token
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const orderId = String(formData.get("orderId") ?? "").trim();
  const verificationCode = String(formData.get("verificationCode") ?? "").trim();

  if (!orderId) {
    redirect("/restaurant/orders/scan?error=missing_order");
  }

  if (!verificationCode) {
    redirect(`/restaurant/orders/scan?orderId=${orderId}&error=invalid`);
  }

  // enviamos la peticion patch al endpoint de canje en nestjs
  const response = await fetch(
    `${process.env.BUZZER_BITE_API_URL}/orders/${orderId}/claim`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ verification_code: verificationCode }),
    },
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  // si el codigo no coincide o la orden ya fue reclamada devolvemos error
  if (!response?.ok) {
    redirect(`/restaurant/orders/scan?orderId=${orderId}&error=invalid`);
  }

  // revalidamos ordenes y tablero y vamos a la pantalla de confirmacion
  revalidatePath("/restaurant/orders");
  revalidatePath("/restaurant");
  redirect(`/restaurant/orders/picked-up?orderId=${orderId}`);
}

// componente asincrono que lee los parametros de la url y arma el formulario
async function ScanFormContent({ searchParams }: ScanOrderQrPageProps) {
  // verificamos que el restaurante tenga sesion activa
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  const { orderId, error } = await searchParams;

  return (
    <div className="flex w-full flex-col items-start gap-[25px]">
      {/* visor visual de camara qr */}
      <div
        aria-label="Visor de cámara QR"
        className="relative h-[356px] w-full shrink-0 overflow-hidden rounded-[18px] bg-[#1c211e]"
      >
        <img
          src="/images/qr-scan-preview.png"
          alt=""
          className="size-full object-cover"
        />
      </div>

      {/* mensajes de alerta si el codigo es incorrecto o falta seleccionar orden */}
      {error === "invalid" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          El codigo ingresado no coincide o esta orden ya fue entregada
        </p>
      )}
      {error === "missing_order" && (
        <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
          Selecciona primero una orden desde la pestana Listas para escanear
        </p>
      )}

      {/* formulario conectado a la server action claimOrder */}
      <form action={claimOrder} className="flex w-full flex-col items-start gap-4">
        <input type="hidden" name="orderId" value={orderId ?? ""} />

        <div className="flex w-full flex-col items-start gap-2">
          <label
            htmlFor="verificationCode"
            className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
          >
            CODIGO DE RESERVA
          </label>
          <input
            id="verificationCode"
            name="verificationCode"
            type="text"
            placeholder="CR -"
            required
            className="w-full rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-[16px] font-light leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#828b85]"
          />
        </div>

        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
        >
          Validar Código
        </button>
      </form>
    </div>
  );
}

// pagina principal de escaneo de codigo qr
export default function ScanOrderQrPage({
  searchParams,
}: ScanOrderQrPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-5 px-[22px] pt-[84px] pb-28">
      <Link
        href="/restaurant/orders?status=ready"
        className="flex items-center justify-center gap-2 text-[16px] font-medium leading-4 tracking-[0.35px] text-[#f0f3f1]"
      >
        <img src="/icons/back-circle.svg" alt="" width={24} height={24} />
        <span>Atrás</span>
      </Link>

      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Escanear Código QR
      </h1>

      <Suspense fallback={null}>
        <ScanFormContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}