import React from 'react';

interface CrossingCornerBorderProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    bleed?: number;
    thickness?: number;
    /** Length of each arm at the corner cross; both arms use this so corners stay symmetric. */
    cornerLength?: number;
}

export default function CrossingCornerBorder({
    children,
    className = "",
    color = "#c4a484",
    bleed = 2,
    thickness = 0.5,
    cornerLength,
}: CrossingCornerBorderProps) {
    const L = cornerLength ?? bleed;
    const edge = { backgroundColor: color };
    return (
        <div className={`relative ${className}`}>
            {/* Edge segments between corners (flush with box) */}
            <div className="absolute pointer-events-none" style={{ ...edge, top: 0, left: L, right: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, bottom: 0, left: L, right: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, left: 0, top: L, bottom: L, width: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, right: 0, top: L, bottom: L, width: thickness }} />
            {/* Corner L's on box: vertex at corner, arms length L along edges */}
            <div className="absolute pointer-events-none top-0 left-0" style={{ ...edge, width: L, height: thickness }} />
            <div className="absolute pointer-events-none top-0 left-0" style={{ ...edge, width: thickness, height: L }} />
            <div className="absolute pointer-events-none top-0 right-0" style={{ ...edge, width: L, height: thickness }} />
            <div className="absolute pointer-events-none top-0 right-0" style={{ ...edge, width: thickness, height: L }} />
            <div className="absolute pointer-events-none bottom-0 left-0" style={{ ...edge, width: L, height: thickness }} />
            <div className="absolute pointer-events-none bottom-0 left-0" style={{ ...edge, width: thickness, height: L }} />
            <div className="absolute pointer-events-none bottom-0 right-0" style={{ ...edge, width: L, height: thickness }} />
            <div className="absolute pointer-events-none bottom-0 right-0" style={{ ...edge, width: thickness, height: L }} />
            {/* Bleed: corner arms extending outward (symmetric length L) */}
            <div className="absolute pointer-events-none" style={{ ...edge, top: 0, left: -L, width: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, top: -L, left: 0, width: thickness, height: L }} />
            <div className="absolute pointer-events-none" style={{ ...edge, top: 0, right: -L, width: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, top: -L, right: 0, width: thickness, height: L }} />
            <div className="absolute pointer-events-none" style={{ ...edge, bottom: 0, left: -L, width: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, bottom: -L, left: 0, width: thickness, height: L }} />
            <div className="absolute pointer-events-none" style={{ ...edge, bottom: 0, right: -L, width: L, height: thickness }} />
            <div className="absolute pointer-events-none" style={{ ...edge, bottom: -L, right: 0, width: thickness, height: L }} />
            {children}
        </div>
    );
}
