type HeroAttractionPlaceholderProps = {
    className?: string;
};

/** Lightweight SVG wireframe shown while the R3F canvas / GLB load. */
export default function HeroAttractionPlaceholder({ className = "" }: HeroAttractionPlaceholderProps) {
    return (
        <div
            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${className}`}
            aria-hidden
        >
            <svg
                viewBox="0 0 120 120"
                className="size-[58%] max-w-[min(58%,220px)] text-foreground/35 animate-[spin_24s_linear_infinite]"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.65"
                strokeLinejoin="round"
            >
                {/* Icosahedron-style geodesic wireframe (static stand-in for the GLB). */}
                <polygon points="60,8 95,28 95,68 60,88 25,68 25,28" opacity="0.55" />
                <polygon points="60,32 82,44 82,68 60,80 38,68 38,44" opacity="0.85" />
                <line x1="60" y1="8" x2="60" y2="32" />
                <line x1="95" y1="28" x2="82" y2="44" />
                <line x1="95" y1="68" x2="82" y2="68" />
                <line x1="60" y1="88" x2="60" y2="80" />
                <line x1="25" y1="68" x2="38" y2="68" />
                <line x1="25" y1="28" x2="38" y2="44" />
                <line x1="60" y1="8" x2="95" y2="28" />
                <line x1="95" y1="28" x2="95" y2="68" />
                <line x1="95" y1="68" x2="60" y2="88" />
                <line x1="60" y1="88" x2="25" y2="68" />
                <line x1="25" y1="68" x2="25" y2="28" />
                <line x1="25" y1="28" x2="60" y2="8" />
                <line x1="60" y1="32" x2="82" y2="44" />
                <line x1="82" y1="44" x2="82" y2="68" />
                <line x1="82" y1="68" x2="60" y2="80" />
                <line x1="60" y1="80" x2="38" y2="68" />
                <line x1="38" y1="68" x2="38" y2="44" />
                <line x1="38" y1="44" x2="60" y2="32" />
                <line x1="60" y1="32" x2="82" y2="68" opacity="0.45" />
                <line x1="82" y1="44" x2="60" y2="80" opacity="0.45" />
                <line x1="38" y1="44" x2="82" y2="68" opacity="0.45" />
                <line x1="38" y1="68" x2="82" y2="44" opacity="0.45" />
                <line x1="60" y1="32" x2="60" y2="80" opacity="0.45" />
                <line x1="38" y1="44" x2="95" y2="28" opacity="0.3" />
                <line x1="82" y1="44" x2="25" y2="28" opacity="0.3" />
                <line x1="82" y1="68" x2="25" y2="68" opacity="0.3" />
                <line x1="38" y1="68" x2="95" y2="68" opacity="0.3" />
                <line x1="60" y1="80" x2="60" y2="8" opacity="0.3" />
                <line x1="38" y1="44" x2="60" y2="88" opacity="0.3" />
            </svg>
        </div>
    );
}
