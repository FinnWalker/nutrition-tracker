import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  width?: "default" | "full" | "narrow";
};

const widthClassNames = {
  default: "mx-auto w-full max-w-5xl",
  full: "w-full",
  narrow: "mx-auto w-full max-w-3xl",
} as const;

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default function PageContainer({
  children,
  className,
  width = "default",
}: PageContainerProps) {
  return (
    <section className={joinClassNames(widthClassNames[width], className)}>
      {children}
    </section>
  );
}
