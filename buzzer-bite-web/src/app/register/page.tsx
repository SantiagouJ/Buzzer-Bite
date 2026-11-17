import { Inter, Kanit } from "next/font/google";
import Link from "next/link";
import BackLink from "../../components/back-link";

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "600"],
});

const kanit = Kanit({
  subsets: ["latin"],
  weight: "600",
});

const choiceClass =
  "flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-[#f3f6f4] text-[16px] leading-[22px] font-semibold whitespace-nowrap text-[#0b0d0c]";

export default function RegisterChoicePage() {
  return (
    <main className={`${inter.className} relative flex min-h-dvh flex-col overflow-hidden bg-[#1f6b52] text-[#f3f6f4]`}>
      <BackLink href="/" className="absolute top-5 left-5 z-10" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          alt=""
          src="/welcome/background.png"
          className="absolute top-0 left-[-59.25%] h-full w-[218.5%] max-w-none"
        />
      </div>

      <div className="relative flex flex-1 items-center justify-center px-5">
        <h1 className={`${kanit.className} relative h-[144px] w-[272px]`}>
          <span className="sr-only">Buzzer Bite</span>
          <span
            aria-hidden
            className="absolute top-[25.49px] left-[199.88px] flex size-[60.121px] items-center justify-center"
          >
            <span className="size-[42.866px] rotate-[-52.36deg] bg-[#2ee07a]" />
          </span>
          <span
            aria-hidden
            className="absolute top-[9.07px] left-[12px] text-[59.033px] leading-[81.171px] font-semibold whitespace-nowrap text-[#f3f6f4]"
          >
            Buzzer
          </span>
          <span
            aria-hidden
            className="absolute top-[52.85px] left-[116.88px] text-[59.033px] leading-[81.171px] font-semibold whitespace-nowrap text-[#f3f6f4]"
          >
            Bite
          </span>
        </h1>
      </div>

      <div className="relative mx-auto flex w-full max-w-[400px] flex-col gap-4 px-5 pt-4 pb-5">
        <Link href="/register/usuario" className={choiceClass}>
          Soy usuario
        </Link>
        <Link href="/register/comercio" className={choiceClass}>
          Soy comercio
        </Link>
        <Link
          href="/login"
          className="self-center text-[13px] leading-[18px] font-medium whitespace-nowrap text-white"
        >
          Ya tienes cuenta? Inicia Sesión.
        </Link>
      </div>
    </main>
  );
}
