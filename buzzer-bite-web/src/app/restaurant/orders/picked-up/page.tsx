import Link from "next/link";

export default function OrderPickedUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[84px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Picked up
      </h1>

      <p className="w-full text-[15px] font-normal leading-[22px] text-[#8e9892]">
        El código coincidió. El pack ya salió.
      </p>

      <section
        aria-label="Resumen de orden entregada"
        className="flex w-full flex-col items-center gap-[10px] rounded-[22px] bg-[#161a18] p-[18px] whitespace-nowrap"
      >
        <p className="text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
          CR-1234
        </p>
        <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f3f6f4]">
          María García
        </p>
        <p className="text-[15px] font-normal leading-[22px] text-[#8e9892]">
          Crunchy Chicken · $20.000
        </p>
      </section>

      <Link
        href="/restaurant/orders"
        className="flex w-full items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
      >
        Volver a Ordenes
      </Link>
    </main>
  );
}
