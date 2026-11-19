import Link from "next/link";
import { storeInitial } from "./offer-format";

type OfferCardProps = {
  name: string;
  href?: string;
  imageUrl: string | null;
  imageHeight: number;
  category: string;
  logo?: { url: string | null };
  priceLabel: string;
  priceMuted?: boolean;
  favorite: { active: boolean; storeName: string; onToggle: () => void };
  distanceLabel: string | null;
  countLabel: string;
  hoursLabel: string | null;
};

export default function OfferCard({
  name,
  href,
  imageUrl,
  imageHeight,
  category,
  logo,
  priceLabel,
  priceMuted = false,
  favorite,
  distanceLabel,
  countLabel,
  hoursLabel,
}: OfferCardProps) {
  return (
    <article className="relative w-full overflow-hidden rounded-[20px] bg-[#1c211e]">
      <div className="relative overflow-hidden bg-[#151a17]" style={{ height: imageHeight }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[42px] leading-none font-bold text-[#f3f6f4]/10"
          >
            {storeInitial(name)}
          </span>
        )}
        {category ? (
          <span className="absolute top-3 right-3 max-w-[45%] truncate rounded-full bg-[#f3f6f4] px-[9px] py-[5px] text-[9px] leading-[11px] font-semibold text-[#0b0d0c]">
            {category}
          </span>
        ) : null}
      </div>

      {logo ? (
        <div
          className="absolute left-4 flex size-[50px] items-center justify-center overflow-hidden rounded-full border-2 border-[#2ee07a] bg-[#1c211e] text-[18px] leading-none font-bold text-[#f3f6f4]"
          style={{ top: imageHeight - 25 }}
        >
          {logo.url ? <img src={logo.url} alt="" className="size-full object-cover" /> : storeInitial(name)}
        </div>
      ) : null}

      <div className={`flex flex-col gap-4 px-4 pb-4 ${logo ? "pt-[30px]" : "pt-[17px]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] leading-[22px] font-bold tracking-[-0.1px] text-[#f0f3f1]">
              {href ? (
                <Link href={href} className="after:absolute after:inset-0">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h2>
            <p
              className={`text-[13px] leading-[18px] font-medium ${
                priceMuted ? "text-[#8e9892]" : "text-[#2ee07a]"
              }`}
            >
              {priceLabel}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={favorite.active}
            aria-label={
              favorite.active
                ? `Quitar ${favorite.storeName} de favoritos`
                : `Guardar ${favorite.storeName} en favoritos`
            }
            onClick={favorite.onToggle}
            className="relative z-10 shrink-0 cursor-pointer"
          >
            <img
              src={favorite.active ? "/explorar/heart-filled.svg" : "/explorar/heart.svg"}
              alt=""
              width={24}
              height={24}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 text-[12px] leading-4 text-[#8a948d]">
          <div className="flex min-w-0 items-center gap-2">
            {distanceLabel ? (
              <span className="flex items-center gap-1">
                <img src="/explorar/pin.svg" alt="" width={14} height={14} />
                {distanceLabel}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <img src="/explorar/bag.svg" alt="" width={16} height={16} />
              {countLabel}
            </span>
          </div>
          {hoursLabel ? (
            <span className="flex shrink-0 items-center gap-1">
              <img src="/explorar/clock.svg" alt="" width={16} height={16} />
              {hoursLabel}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
