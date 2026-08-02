"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { getSafeCallbackPath } from "@/app/lib/auth-redirect";

type GoogleSignInButtonProps = {
  className: string;
  label: string;
};

export default function GoogleSignInButton({
  className,
  label,
}: GoogleSignInButtonProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackPath(
    `${pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`,
  );

  return (
    <button
      type="button"
      className={className}
      onClick={() => signIn("google", { callbackUrl })}
    >
      <GoogleMark />
      <span>{label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        d="M21.805 12.225c0-.728-.065-1.427-.186-2.1H12.24v3.973h5.36a4.59 4.59 0 0 1-1.99 3.013v2.5h3.222c1.885-1.736 2.973-4.295 2.973-7.386Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 22c2.688 0 4.943-.892 6.591-2.389l-3.222-2.5c-.892.597-2.034.948-3.369.948-2.583 0-4.772-1.744-5.554-4.088H3.355v2.579A9.95 9.95 0 0 0 12.24 22Z"
        fill="#34A853"
      />
      <path
        d="M6.686 13.97a5.982 5.982 0 0 1-.311-1.97c0-.684.117-1.348.311-1.97V7.45H3.355A9.954 9.954 0 0 0 2.29 12c0 1.608.386 3.129 1.065 4.55l3.331-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 5.94c1.461 0 2.773.503 3.805 1.49l2.854-2.853C17.178 2.967 14.928 2 12.24 2a9.95 9.95 0 0 0-8.885 5.45l3.331 2.58C7.468 7.684 9.657 5.94 12.24 5.94Z"
        fill="#EA4335"
      />
    </svg>
  );
}
