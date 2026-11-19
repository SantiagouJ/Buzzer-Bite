import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import Link from "next/link";
import BackLink from "./back-link";
import CityInput from "./city-input";
import SubmitButton from "./submit-button";
import { canonicalCity } from "../data/colombia-cities";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { apiUrl, SESSION_COOKIE } from "../lib/buzzer-api";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fieldLabelClass =
  "text-[12px] font-medium leading-4 tracking-[0.35px] text-[#8e9892]";
const fieldInputClass =
  "w-full rounded-[16px] bg-[#1c211e] px-4 py-[13px] text-[15px] font-normal leading-[22px] text-[#f3f6f4] outline-none placeholder:text-[#f3f6f4]/40";

const roles = {
  consumer: {
    path: "/register/usuario",
    title: "Crear una cuenta",
    subtitle: "Entra y descubre packs cerca de ti.",
    submit: "Crear Cuenta",
  },
  merchant: {
    path: "/register/comercio",
    title: "Abrir una Cocina",
    subtitle: "Publica packs antes de que se pierdan.",
    submit: "Crear Cocina",
  },
} as const;

type RegisterRole = keyof typeof roles;

type RegisterPayload = {
  email: string;
  password: string;
  full_name: string;
  role: RegisterRole;
  location?: string;
};

async function postRegister(payload: RegisterPayload) {
  return fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

async function readApiMessage(response: Response) {
  const data = await response.json().catch(() => null);
  const message =
    data && typeof data === "object" ? (data as { message?: unknown }).message : null;
  const parts = Array.isArray(message)
    ? message.filter((item): item is string => typeof item === "string")
    : typeof message === "string"
      ? [message]
      : [];
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.slice(0, 240) || null;
}

function rejectsUnknownLocation(message: string | null) {
  if (!message) return false;
  return /location/i.test(message) && /should not exist|no debe existir/i.test(message);
}

function invalidRedirect(path: string, detail: string | null): never {
  const params = new URLSearchParams({ error: "invalid" });
  if (detail) params.set("detail", detail);
  redirect(`${path}?${params.toString()}`);
}

async function register(formData: FormData) {
  "use server";

  const roleValue = formData.get("role");
  const role = roleValue === "consumer" || roleValue === "merchant" ? roleValue : null;
  if (!role) redirect("/register");

  const path = roles[role].path;
  const full_name = String(
    formData.get(role === "merchant" ? "restaurant" : "full_name") ?? "",
  ).trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const location = canonicalCity(String(formData.get("location") ?? ""));
  if (!location) redirect(`${path}?error=city`);

  let response = await postRegister({ email, password, full_name, role, location });
  if (response?.status === 400) {
    const detail = await readApiMessage(response);
    if (rejectsUnknownLocation(detail)) {
      response = await postRegister({ email, password, full_name, role });
    } else {
      invalidRedirect(path, detail);
    }
  }

  if (response?.status === 409) redirect(`${path}?error=exists`);
  if (response?.status === 400) invalidRedirect(path, await readApiMessage(response));
  if (!response?.ok) redirect(`${path}?error=1`);

  if (role === "merchant") {
    const category = String(formData.get("category") ?? "").trim();
    const loginResponse = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    const data = await loginResponse?.json().catch(() => null);
    const token = data?.access_token;
    if (!loginResponse?.ok || typeof token !== "string" || !token) {
      redirect("/login?registered=1");
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60,
    });

    const params = new URLSearchParams({ name: full_name, category, city: location });
    redirect(`/register/comercio/mapa?${params.toString()}`);
  }

  redirect("/login?registered=1");
}

type RegisterFormProps = {
  role: RegisterRole;
  searchParams: Promise<{ error?: string; detail?: string }>;
};

async function RegisterStatus({ searchParams }: Pick<RegisterFormProps, "searchParams">) {
  const { error, detail } = await searchParams;
  const apiDetail = typeof detail === "string" ? detail.trim().slice(0, 240) : "";

  if (error === "exists") {
    return (
      <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
        Ese correo ya tiene una cuenta.
      </p>
    );
  }

  if (error === "city") {
    return (
      <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
        Elige una ciudad de la lista.
      </p>
    );
  }

  if (error === "invalid") {
    return (
      <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
        {apiDetail || "Revisa los datos e inténtalo de nuevo."}
      </p>
    );
  }

  if (error === "1") {
    return (
      <p role="alert" className="text-[13px] font-normal leading-[18px] text-[#ff8f8f]">
        No se pudo crear la cuenta. Revisar los datos o la conexión.
      </p>
    );
  }

  return null;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-[6px]">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function RegisterForm({ role, searchParams }: RegisterFormProps) {
  const { title, subtitle, submit } = roles[role];
  const isMerchant = role === "merchant";

  return (
    <main className={`${inter.className} min-h-dvh bg-[#101311] text-[#f3f6f4]`}>
      <div
        className={`mx-auto flex w-full max-w-[400px] flex-col items-start px-5 pt-5 pb-5 ${isMerchant ? "gap-3" : "gap-[14px]"}`}
      >
        <BackLink href="/register" />
        <div className="flex h-12 w-full items-start justify-center">
          <img src="/brand/logo.svg" alt="" width={48} height={45.7019} />
        </div>

        <h1 className="w-full text-[26px] font-bold leading-8 tracking-[-0.3px]">{title}</h1>
        <p className="w-full text-[15px] font-normal leading-[22px] text-[#8e9892]">{subtitle}</p>

        <Suspense fallback={null}>
          <RegisterStatus searchParams={searchParams} />
        </Suspense>

        <form
          action={register}
          className={`flex w-full flex-col ${isMerchant ? "gap-3" : "gap-[14px]"}`}
        >
          <input type="hidden" name="role" value={role} />

          {isMerchant ? (
            <Field id="restaurant" label="RESTAURANTE">
              <input
                id="restaurant"
                name="restaurant"
                type="text"
                autoComplete="organization"
                required
                maxLength={120}
                placeholder="KFC Cali Norte"
                className={fieldInputClass}
              />
            </Field>
          ) : (
            <Field id="full_name" label="NOMBRE">
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                placeholder="Tu nombre"
                className={fieldInputClass}
              />
            </Field>
          )}

          <Field id="email" label={isMerchant ? "EMAIL DEL NEGOCIO" : "EMAIL"}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={150}
              placeholder={isMerchant ? "kfc.cali@crave.co" : "your@email.com"}
              className={fieldInputClass}
            />
          </Field>

          <Field id="password" label="CONTRASEÑA">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={15}
              maxLength={128}
              pattern="[A-Za-z0-9 _\-]+"
              title="Al menos 15 caracteres: letras, números, espacios o guiones."
              placeholder="Crear contraseña"
              className={fieldInputClass}
            />
            <p className="text-[12px] font-normal leading-4 text-[#8e9892]">
              Al menos 15 caracteres: letras, números, espacios o guiones.
            </p>
          </Field>

          <Field id="location" label="UBICACIÓN">
            <CityInput id="location" className={fieldInputClass} />
          </Field>

          {isMerchant ? (
            <Field id="category" label="COCINA">
              <input
                id="category"
                name="category"
                type="text"
                required
                maxLength={50}
                placeholder="Comida Rápida"
                className={fieldInputClass}
              />
            </Field>
          ) : (
            <p className="text-[13px] font-normal leading-[18px] text-[#8e9892]">
              Lo usamos para mostrarte restaurantes cercanos.
            </p>
          )}

          <SubmitButton
            label={submit}
            pendingLabel="Creando..."
            className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#f3f6f4] py-[15px] text-[16px] font-semibold leading-[22px] text-[#0b0d0c]"
          />
        </form>

        {isMerchant ? null : (
          <Link href="/login" className="text-[13px] font-normal leading-[18px] text-[#2ee07a]">
            Ya tienes unas cuenta? Inicia Sesión.
          </Link>
        )}
      </div>
    </main>
  );
}
