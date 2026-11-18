import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import RestaurantBottomNav from "../../components/restaurant-bottom-nav";
import { requireMerchant } from "./session";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

async function MerchantGate({ children }: { children: ReactNode }) {
  await requireMerchant();
  return children;
}

export default function RestaurantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={`${inter.className} min-h-dvh bg-[#101311] text-[#f3f6f4]`}>
      <Suspense fallback={null}>
        <MerchantGate>{children}</MerchantGate>
      </Suspense>
      <Suspense fallback={null}>
        <RestaurantBottomNav />
      </Suspense>
    </div>
  );
}
