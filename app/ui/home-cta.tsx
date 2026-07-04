import Link from "next/link";

export default function HomeCta() {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="/dashboard"
        className="border border-border px-4 py-2 text-sm"
      >
        Open dashboard
      </Link>
    </div>
  );
}
