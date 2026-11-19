import Link from "next/link";

export default function BackLink({ href, className = "" }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className={`flex size-10 items-center justify-center text-[#f3f6f4] ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 6L9 12L15 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
