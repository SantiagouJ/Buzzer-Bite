import Link from "next/link";
import { Suspense } from "react";

type PackItem = {
  id: string;
  title: string;
  category: string;
  price: string;
  pickupWindow: string;
  remaining: number;
  total: number;
  status: "AVAILABLE" | "SOLD_OUT";
  imageUrl: string;
};

const SAMPLE_PACKS: PackItem[] = [
  {
    id: "pack-1",
    title: "Pack Sorpresa",
    category: "Antojos",
    price: "$17.900",
    pickupWindow: "2-7 PM",
    remaining: 3,
    total: 6,
    status: "AVAILABLE",
    imageUrl: "/images/pack-sample.png",
  },
  {
    id: "pack-2",
    title: "Pack Sorpresa",
    category: "Antojos",
    price: "$17.900",
    pickupWindow: "2-7 PM",
    remaining: 3,
    total: 6,
    status: "AVAILABLE",
    imageUrl: "/images/pack-sample.png",
  },
  {
    id: "pack-3",
    title: "Pack Sorpresa",
    category: "Antojos",
    price: "$17.900",
    pickupWindow: "2-7 PM",
    remaining: 0,
    total: 6,
    status: "SOLD_OUT",
    imageUrl: "/images/pack-sample.png",
  },
];

type PacksPageProps = {
  searchParams: Promise<{ status?: string }>;
};

async function PacksContent({ searchParams }: PacksPageProps) {
  const { status } = await searchParams;
  const currentStatus = status === "SOLD_OUT" ? "SOLD_OUT" : "AVAILABLE";
  const visiblePacks = SAMPLE_PACKS.filter(
    (pack) => pack.status === currentStatus,
  );

  return (
    <>
      <div
        role="tablist"
        aria-label="Filtrar packs por estado"
        className="flex items-start gap-2"
      >
        <Link
          href="/restaurant/packs?status=AVAILABLE"
          role="tab"
          aria-selected={currentStatus === "AVAILABLE"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${
            currentStatus === "AVAILABLE"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
          }`}
        >
          Activos
        </Link>

        <Link
          href="/restaurant/packs?status=SOLD_OUT"
          role="tab"
          aria-selected={currentStatus === "SOLD_OUT"}
          className={`flex items-start rounded-full px-[14px] py-[7px] text-[13px] font-semibold leading-4 whitespace-nowrap ${
            currentStatus === "SOLD_OUT"
              ? "bg-[#f3f6f4] text-[#0b0d0c]"
              : "bg-[#1c211e] text-[#f3f6f4]"
          }`}
        >
          Agotados
        </Link>
      </div>

      <section
        aria-label="Listado de packs"
        className="flex w-full flex-col items-start gap-3"
      >
        {visiblePacks.map((pack) => {
          const progressPercent =
            pack.total > 0
              ? Math.round((pack.remaining / pack.total) * 100)
              : 0;

          return (
            <article
              key={pack.id}
              className="relative flex w-full flex-col items-start gap-[19px] overflow-hidden rounded-[20px] bg-[#1c211e]"
            >
              <div className="relative h-[112px] w-full shrink-0">
                <img
                  src={pack.imageUrl}
                  alt={pack.title}
                  className="size-full object-cover"
                />
                <span className="absolute top-3 left-3 flex items-center rounded-full bg-[#f3f6f4] px-[9.37px] py-[5.35px] text-[8.7px] font-semibold leading-[10.7px] text-[#0b0d0c]">
                  {pack.category}
                </span>
              </div>

              <div className="flex w-full flex-col items-start gap-4 px-4 pb-4">
                <div className="flex w-full flex-col items-start gap-[2px]">
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-[10px]">
                      <h2 className="text-[17px] font-semibold leading-[22px] tracking-[-0.1px] text-[#f0f3f1]">
                        {pack.title}
                      </h2>
                      <Link
                        href={`/restaurant/packs/${pack.id}`}
                        aria-label={`Editar ${pack.title}`}
                        className="flex size-5 shrink-0 items-center justify-center"
                      >
                        <img
                          src="/icons/edit.svg"
                          alt=""
                          width={20}
                          height={20}
                        />
                      </Link>
                    </div>

                    <button
                      type="button"
                      aria-label={`Eliminar ${pack.title}`}
                      className="flex size-5 shrink-0 cursor-pointer items-center justify-center"
                    >
                      <img
                        src="/icons/trash.svg"
                        alt=""
                        width={20}
                        height={20}
                      />
                    </button>
                  </div>

                  <p className="text-[13px] font-medium leading-[18px] text-[#2ee07a]">
                    {pack.price}
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
                      {pack.pickupWindow}
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
                      {pack.remaining}/{pack.total} restantes
                    </span>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={pack.remaining}
                  aria-valuemin={0}
                  aria-valuemax={pack.total}
                  className="relative h-[6px] w-full overflow-hidden rounded-[99px] bg-[#292e2a]"
                >
                  <div
                    className="h-[6px] rounded-[99px] bg-[#2ee07a]"
                    style={{
                      width:
                        pack.remaining === 3 && pack.total === 6
                          ? "200px"
                          : `${progressPercent}%`,
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

export default function RestaurantPacksPage({ searchParams }: PacksPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-3 px-5 pt-[84px] pb-28">
      <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px] text-[#f3f6f4]">
        Packs
      </h1>

      <Suspense fallback={null}>
        <PacksContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
