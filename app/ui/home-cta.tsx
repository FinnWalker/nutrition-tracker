import Link from "next/link";

export default function HomeCta() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/dashboard"
        className="rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
      >
        Open dashboard
      </Link>
    </div>
  );
}
