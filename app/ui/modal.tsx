"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";

type ModalProps = {
  children: React.ReactNode;
};

export default function Modal({ children }: ModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <button
        type="button"
        aria-label="Close login modal"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={() => router.back()}
      />
      <div className="relative z-10 w-full max-w-3xl">
        <button
          type="button"
          aria-label="Close login modal"
          className="absolute top-4 right-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-soft transition-colors hover:bg-surface-elevated hover:text-foreground"
          onClick={() => router.back()}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
