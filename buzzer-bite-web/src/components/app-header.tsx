"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header className="site-header">
      <p className="brand">Coffee Orders</p>
      <nav aria-label="Navegación principal">
        <Link href="/">Inicio</Link>
        <Link href="/orders">Pedidos</Link>
        <Link href="/otraPagina">Otra Página</Link>
        <Link href="/login">Login</Link>
      </nav>
    </header>
  );
}