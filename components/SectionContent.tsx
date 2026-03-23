import Link from "next/link";

export default function SectionContent({
  children,
  "aria-label": ariaLabel,
  showBackButton = true,
  backHref = "/",
  backLabel = "Back to home",
}: {
  children: React.ReactNode;
  "aria-label"?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="py-[clamp(24px,5vh,40px)]" aria-label={ariaLabel}>
      {showBackButton && (
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-2 font-quicksand font-light text-foreground/80 text-[clamp(12px,0.833vw,14px)] tracking-wide transition-colors hover:text-foreground"
        >
          <span aria-hidden>←</span>
          {backLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
