"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="flex cursor-pointer items-center justify-center gap-2 text-[16px] font-medium leading-4 tracking-[0.35px] text-[#f0f3f1]"
    >
      <img src="/icons/back-circle.svg" alt="" width={24} height={24} />
      <span>Atrás</span>
    </button>
  );
}
