import CrossingCornerBorder from "./CrossingCornerBorder";
import { ReactNode } from "react";

interface SocialIconProps {
    href: string;
    icon: ReactNode;
    disabled?: boolean;
    tooltip?: string;
    isExternal?: boolean;
}

export default function SocialIcon({ href, icon, disabled, tooltip, isExternal = true }: SocialIconProps) {
    return (
        <a
            href={disabled ? "#" : href}
            target={disabled ? undefined : (isExternal ? "_blank" : undefined)}
            rel={isExternal && !disabled ? "noopener noreferrer" : undefined}
            className={`group block transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-95'}`}
            title={tooltip}
        >
            <CrossingCornerBorder 
                bleed="clamp(3px, 0.3125vw, 6px)"
                thickness="clamp(1px, 0.052vw, 1.5px)"
                className="bg-[#502e2e] group-hover:bg-[#7a4b4b] group-hover:[--border-color:#dec7b0] transition-all duration-300 flex items-center justify-center p-[clamp(4px,0.416vw,8px)]"
            >
                <div className="flex items-center justify-center size-[clamp(28px,2.5vw,48px)]">
                    {icon}
                </div>
            </CrossingCornerBorder>
        </a>
    );
}
