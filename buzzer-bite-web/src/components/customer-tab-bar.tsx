import Link from "next/link";

const tabs = [
  { key: "inicio", label: "Home", href: "/usuario/inicio", icon: "home" },
  { key: "explorar", label: "Explorar", href: "/usuario/explorar", icon: "explore" },
  { key: "favoritos", label: "Favoritos", href: "/usuario/favoritos", icon: "heart" },
  { key: "perfil", label: "Perfil", href: "/usuario/perfil", icon: "profile" },
] as const;

export type CustomerTab = (typeof tabs)[number]["key"];

export default function CustomerTabBar({
  current,
  className,
  linkCurrent = false,
}: {
  current: CustomerTab;
  className: string;
  linkCurrent?: boolean;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className={`z-30 flex items-center justify-center gap-[25px] overflow-hidden rounded-full bg-[#232323] p-2 shadow-[0px_-4px_24px_0px_rgba(0,0,0,0.4)] backdrop-blur-[12px] ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === current;
        const content = (
          <>
            <img src={`/tabs/${tab.icon}${active ? "-active" : ""}.svg`} alt="" width={24} height={24} />
            <span className={`text-[12px] leading-3 font-medium ${active ? "text-[#2ee07a]" : "text-[#8e9892]"}`}>
              {tab.label}
            </span>
          </>
        );
        const itemClass = "flex h-12 w-16 flex-col items-center justify-center gap-1";

        if (tab.href && (!active || linkCurrent)) {
          return (
            <Link key={tab.key} href={tab.href} className={itemClass}>
              {content}
            </Link>
          );
        }

        return (
          <div key={tab.key} className={itemClass} aria-current={active ? "page" : undefined}>
            {content}
          </div>
        );
      })}
    </nav>
  );
}
