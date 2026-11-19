import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function UsuarioLayout({ children }: { children: ReactNode }) {
  return <div className={`${inter.className} min-h-dvh bg-[#101311] text-[#f3f6f4]`}>{children}</div>;
}
