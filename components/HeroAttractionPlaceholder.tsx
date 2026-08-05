type HeroAttractionPlaceholderProps = {
    className?: string;
};

/** Rippling circle shown while the R3F canvas / GLB load. */
export default function HeroAttractionPlaceholder({ className = "" }: HeroAttractionPlaceholderProps) {
    return (
        <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${className}`}
            aria-hidden
        >
            <div className="hero-attraction-ripple relative size-[clamp(48px,4vw,64px)]">
                <span className="hero-attraction-ripple__ring" />
                <span className="hero-attraction-ripple__ring" />
                <span className="hero-attraction-ripple__ring" />
                <span className="hero-attraction-ripple__core" />
            </div>
        </div>
    );
}
