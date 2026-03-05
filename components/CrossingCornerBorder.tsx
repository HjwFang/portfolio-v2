import React from 'react';

interface CrossingCornerBorderProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    bleed?: number;
    thickness?: number;
}

export default function CrossingCornerBorder({
    children,
    className = "",
    color = "#c4a484",
    bleed = 2,
    thickness = 0.5,
}: CrossingCornerBorderProps) {
    return (
        <div className={`relative ${className}`}>
            {/* Top border line */}
            <div
                className="absolute pointer-events-none"
                style={{ top: 0, left: -bleed, right: -bleed, height: thickness, backgroundColor: color }}
            />
            {/* Bottom border line */}
            <div
                className="absolute pointer-events-none"
                style={{ bottom: 0, left: -bleed, right: -bleed, height: thickness, backgroundColor: color }}
            />
            {/* Left border line */}
            <div
                className="absolute pointer-events-none"
                style={{ left: 0, top: -bleed, bottom: -bleed, width: thickness, backgroundColor: color }}
            />
            {/* Right border line */}
            <div
                className="absolute pointer-events-none"
                style={{ right: 0, top: -bleed, bottom: -bleed, width: thickness, backgroundColor: color }}
            />

            {children}
        </div>
    );
}
