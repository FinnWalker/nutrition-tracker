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
      {label}
    </button>
  );
}
