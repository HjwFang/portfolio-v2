import Link from "next/link";

export default function SectionContent({
  children,
  "aria-label": ariaLabel,
  showBackButton = true,
}: {
  children: React.ReactNode;
  "aria-label"?: string;
  showBackButton?: boolean;
}) {
  return (
    <div className="py-10" aria-label={ariaLabel}>
      {showBackButton && (
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-quicksand font-light text-foreground/80 text-sm tracking-wide transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span>
          Back to home
        </Link>
      )}
      {children}
    </div>
  );
}
