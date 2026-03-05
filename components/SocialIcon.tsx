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
            className={`hover:-translate-y-1 transition-transform ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            title={tooltip}
        >
            <CrossingCornerBorder className="bg-[#502e2e] flex items-center justify-center size-10 xl:size-12">
                {icon}
            </CrossingCornerBorder>
        </a>
    );
}
