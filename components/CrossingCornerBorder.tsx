import React from 'react';

interface CrossingCornerBorderProps {
    children: React.ReactNode;
    className?: string;
    color?: string;
    bleed?: number | string;
    thickness?: number | string;
    /** Length of each arm at the corner cross; both arms use this so corners stay symmetric. */
    cornerLength?: number | string;
}

export default function CrossingCornerBorder({
    children,
    className = "",
    color = "#c4a484",
    bleed = 6,
    thickness = 1,
    cornerLength,
}: CrossingCornerBorderProps) {
    const L = cornerLength ?? bleed;
    const edge = { backgroundColor: color };

    const containerStyle = {
        '--border-color': color,
    } as React.CSSProperties;

    const edgeStyle = { backgroundColor: 'var(--border-color)' };

    // Helper to ensure values have units
    const toCSS = (val: number | string) => typeof val === 'number' ? `${val}px` : val;
    const L_css = toCSS(L);
    const T_css = toCSS(thickness);
    const negL_css = typeof L === 'number' ? `${-L}px` : `calc(-1 * ${L})`;

    return (
        <div className={`relative ${className}`} style={containerStyle}>
            {/* Main Edge Lines (Full length of container) */}
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, top: 0, left: 0, width: '100%', height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, bottom: 0, left: 0, width: '100%', height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, left: 0, top: 0, height: '100%', width: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, left: '100%', top: 0, height: '100%', width: T_css, transform: 'translateX(-100%)' }} />

            {/* Bleed Arms (Extending outward from corners) */}
            {/* Top-Left */}
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, top: 0, left: negL_css, width: L_css, height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, top: negL_css, left: 0, width: T_css, height: L_css }} />

            {/* Top-Right */}
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, top: 0, right: negL_css, width: L_css, height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, top: negL_css, right: 0, width: T_css, height: L_css }} />

            {/* Bottom-Left */}
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, bottom: 0, left: negL_css, width: L_css, height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, bottom: negL_css, left: 0, width: T_css, height: L_css }} />

            {/* Bottom-Right */}
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, bottom: 0, right: negL_css, width: L_css, height: T_css }} />
            <div className="absolute pointer-events-none" style={{ ...edgeStyle, bottom: negL_css, right: 0, width: T_css, height: L_css }} />

            {children}
        </div>
    );
}
