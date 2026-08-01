import Link from "next/link";

type HomeCtaProps = {
  basePath?: string;
};

export default function HomeCta({ basePath = "" }: HomeCtaProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={`${basePath}/diary` || "/diary"}
        className="border border-border px-4 py-2 text-sm"
      >
        Open diary
      </Link>
    </div>
  );
}
