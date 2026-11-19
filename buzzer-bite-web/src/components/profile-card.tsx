import type { ReactNode } from "react";

export default function ProfileCard({
  label,
  title,
  subtitle,
  banner,
  avatar,
  children,
}: {
  label: string;
  title: string;
  subtitle: string;
  banner: string;
  avatar?: { src: string; alt: string };
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="relative flex w-full flex-col items-center overflow-hidden rounded-[28px] bg-[#1c211e] shadow-[0px_16px_32px_0px_rgba(0,0,0,0.35)]"
    >
      <div
        className="relative mb-[-5px] h-[118px] w-full shrink-0 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(145.14171661133503deg, rgb(15, 61, 40) 0%, rgb(22, 122, 69) 36%, rgb(11, 42, 28) 80%)",
        }}
      >
        <div className="absolute top-[-60px] left-[210px] size-[180px]">
          <div className="absolute inset-[-20%]">
            <img
              src="/icons/banner-ellipse.svg"
              alt=""
              width={252}
              height={252}
              className="block max-w-none"
            />
          </div>
        </div>

        <div className="absolute top-1/2 left-0 size-[360px] -translate-y-1/2">
          <img
            src={banner}
            alt=""
            className="pointer-events-none size-full object-cover"
          />
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-[18px] px-[22px] pt-[40px] pb-[22px]">
        <div className="flex w-full items-center justify-between pt-2">
          <div className="flex flex-col items-start gap-[2px]">
            <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.1px] text-[#f3f6f4]">
              {title}
            </h2>

            <div className="flex items-center gap-1">
              <img
                src="/icons/location-pin-sm.svg"
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              <p className="text-[13px] font-normal leading-[18px] text-[#8a948d]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {children}
      </div>

      {avatar ? (
        <div className="absolute top-[79px] left-[23px] size-[72px]">
          <img
            src={avatar.src}
            alt={avatar.alt}
            width={72}
            height={72}
            className="block size-full rounded-full object-cover"
          />
        </div>
      ) : null}
    </section>
  );
}
