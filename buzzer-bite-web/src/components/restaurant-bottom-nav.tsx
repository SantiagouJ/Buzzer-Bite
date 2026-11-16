"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Inicio",
    href: "/restaurant",
    icon: "/icons/home-inactive.svg",
    activeIcon: "/icons/home.svg",
  },
  {
    label: "Packs",
    href: "/restaurant/packs",
    icon: "/icons/packs.svg",
    activeIcon: "/icons/packs-active.svg",
  },
  {
    label: "Ordenes",
    href: "/restaurant/orders",
    icon: "/icons/orders.svg",
    activeIcon: "/icons/orders-active.svg",
  },
  {
    label: "Perfil",
    href: "/restaurant/profile",
    icon: "/icons/profile.svg",
    activeIcon: "/icons/profile.svg",
  },
] as const;

export default function RestaurantBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación del restaurante"
      className="fixed bottom-5 left-1/2 z-50 flex w-[360px] max-w-[calc(100vw-40px)] -translate-x-1/2 items-center justify-center gap-[25px] rounded-[100px] bg-[#232323] p-2 shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.4)] backdrop-blur-[12px]"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/restaurant"
            ? pathname === "/restaurant"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="flex h-12 w-16 shrink-0 flex-col items-center justify-center gap-1"
          >
            <img
              src={isActive ? item.activeIcon : item.icon}
              alt=""
              width={24}
              height={24}
              className="block size-6 shrink-0"
            />
            <span
              className={`text-[12px] font-medium leading-3 whitespace-nowrap ${
                isActive ? "text-[#2ee07a]" : "text-[#8e9892]"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
