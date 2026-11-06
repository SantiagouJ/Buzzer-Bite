import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

async function login(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  const response = await fetch(`${process.env.BUZZER_BITE_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);

  if (!response?.ok) redirect("/login?error=1");

  const data = await response.json().catch(() => null);
  const token = data?.access_token;
  if (typeof token !== "string" || !token) redirect("/login?error=1");

  const cookieStore = await cookies();
  cookieStore.set("coffee_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  redirect("/");
}

type LoginPageProps = {
  searchParams: Promise<{ error?: string; registered?: string }>;
};

async function LoginStatus({ searchParams }: LoginPageProps) {
  const { error, registered } = await searchParams;

  if (registered === "1") {
    return (
      <p className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
        Cuenta creada. Ya puedes iniciar sesión.
      </p>
    );
  }

  if (error === "1") {
    return (
      <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
        No se pudo iniciar sesión. Revisar los datos o la conexión.
      </p>
    );
  }

  return null;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className={`${inter.className} min-h-dvh bg-[#101311] text-[#f3f6f4]`}>
      <div className="mx-auto flex w-full max-w-[400px] flex-col items-start gap-4 px-5 pt-[84px] pb-5">
        <div className="flex h-12 w-full items-start justify-center">
          <img src="/brand/logo.svg" alt="" width={48} height={45.7019} />
        </div>

        <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px]">
          Bienvenido de vuelta!
        </h1>
        <p className="text-[15px] font-normal leading-[22px] text-[#8e9892]">
          Entra para ver el ahorro de hoy.
        </p>

        <Suspense fallback={null}>
          <LoginStatus searchParams={searchParams} />
        </Suspense>

        <form action={login} className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="email"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="sarah.Hines@gmail.com"
              className="w-full rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#f3f6f4]"
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <label
              htmlFor="password"
              className="text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]"
            >
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-[18px] bg-[#1c211e] px-4 py-[14px] text-[16px] font-semibold leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#f3f6f4]"
            />
          </div>

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-4 text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
          >
            Iniciar Sesión
          </button>
        </form>

        <Link href="/register" className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
          ¿No tienes cuenta? Crea una.
        </Link>
      </div>
    </main>
  );
}
