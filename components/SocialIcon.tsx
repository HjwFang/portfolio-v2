import CrossingCornerBorder from "./CrossingCornerBorder";
import { MouseEvent, ReactNode } from "react";

interface SocialIconProps {
    href: string;
    icon: ReactNode;
    disabled?: boolean;
    tooltip?: string;
    isExternal?: boolean;
    onHover?: (label: string | null, e?: MouseEvent) => void;
}

export default function SocialIcon({ href, icon, disabled, tooltip, isExternal = true, onHover }: SocialIconProps) {
    const label = tooltip;

    return (
        <a
            href={disabled ? "#" : href}
            target={disabled ? undefined : (isExternal ? "_blank" : undefined)}
            rel={isExternal && !disabled ? "noopener noreferrer" : undefined}
            {...(disabled ? {} : { "data-portfolio-open": "" })}
            className={`group block transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
            onMouseEnter={label && onHover ? (e) => onHover(label, e) : undefined}
            onMouseMove={label && onHover ? (e) => onHover(label, e) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
        >
            <CrossingCornerBorder 
                bleed="clamp(2px, 0.208vw, 4px)"
                thickness="clamp(1px, 0.052vw, 1px)"
                className="bg-[#502e2e] group-hover:bg-[#7a4b4b] group-hover:[--border-color:#dec7b0] transition-all duration-300 flex items-center justify-center p-[clamp(5px,0.35vw,7px)] aspect-square"
            >
                <div className="flex items-center justify-center size-[clamp(16px,1.1vw,20px)]">
                    {icon}
                </div>
            </CrossingCornerBorder>
        </a>
    );
}
