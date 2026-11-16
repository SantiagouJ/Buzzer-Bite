import Link from "next/link";
import { Suspense } from "react";
import PackStockStepper from "../../../../components/pack-stock-stepper";

type EditPackPageProps = {
  params: Promise<{ id: string }>;
};

async function EditPackForm({ params }: EditPackPageProps) {
  const { id } = await params;

  return (
    <form className="flex w-full flex-col items-start gap-[35px]">
      <input type="hidden" name="pack_id" value={id} />

      <PackStockStepper initialStock={3} />

      <div className="flex w-full flex-col items-start gap-[15px]">
        <button
          type="submit"
          name="intent"
          value="delete"
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#fb523f] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
        >
          Borrar Pack
        </button>

        <button
          type="submit"
          name="intent"
          value="save"
          className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

export default function EditPackPage({ params }: EditPackPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-5 px-[22px] pt-[84px] pb-28">
      <Link
        href="/restaurant/packs"
        className="flex items-center justify-center gap-2 text-[16px] font-medium leading-4 tracking-[0.35px] text-[#f0f3f1]"
      >
        <img src="/icons/back-circle.svg" alt="" width={24} height={24} />
        <span>Back</span>
      </Link>

      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Editar Pack
      </h1>

      <section
        aria-label="Detalle del pack"
        className="relative flex w-full flex-col items-start gap-[19px] overflow-hidden rounded-[20px] bg-[#1c211e]"
      >
        <div className="relative h-[112px] w-full shrink-0">
          <img
            src="/images/pack-sample.png"
            alt="Pack Sorpresa"
            className="size-full object-cover"
          />
          <span className="absolute top-3 left-3 flex items-center rounded-full bg-[#f3f6f4] px-[9.37px] py-[5.35px] text-[8.7px] font-semibold leading-[10.7px] text-[#0b0d0c]">
            Antojos
          </span>
        </div>

        <div className="flex w-full flex-col items-start gap-[35px] px-4 pb-4">
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full flex-col items-start gap-[2px]">
              <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f0f3f1]">
                Pack Sorpresa
              </h2>
              <p className="text-[13px] font-medium leading-[18px] text-[#2ee07a]">
                $17.900
              </p>
            </div>

            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-1">
                <img
                  src="/icons/clock-sm.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <span className="text-[12px] font-normal leading-4 text-[#8a948d]">
                  2-7 PM
                </span>
              </div>

              <div className="flex items-center gap-1">
                <img
                  src="/icons/bag-sm.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <span className="text-[12px] font-normal leading-4 text-[#8a948d]">
                  3/6 Restantes
                </span>
              </div>
            </div>

            <div
              role="progressbar"
              aria-valuenow={3}
              aria-valuemin={0}
              aria-valuemax={6}
              className="relative h-[6px] w-full overflow-hidden rounded-[99px] bg-[#292e2a]"
            >
              <div className="h-[6px] w-[200px] rounded-[99px] bg-[#2ee07a]" />
            </div>
          </div>

          <Suspense fallback={null}>
            <EditPackForm params={params} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
