import Link from "next/link";

export default function ScanOrderQrPage() {
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

      <div className="flex w-full flex-col items-start gap-[25px]">
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

        <form
          action="/restaurant/orders/picked-up"
          className="flex w-full flex-col items-start gap-4"
        >
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
    </main>
  );
}
