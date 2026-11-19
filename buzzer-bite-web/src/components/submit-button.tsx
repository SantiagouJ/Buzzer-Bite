"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  label,
  pendingLabel,
  className,
}: {
  label: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
