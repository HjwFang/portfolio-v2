"use client";

import { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
    const [isVisible, setIsVisible] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const cursorRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const delayedPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            if (!isVisible) setIsVisible(true);

            // Detect if hovering over a clickable element
            const target = e.target as HTMLElement;
            setIsPointer(
                window.getComputedStyle(target).cursor === "pointer" ||
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.closest("a") !== null ||
                target.closest("button") !== null
            );
        };

        const onMouseLeave = () => setIsVisible(false);
        const onMouseEnter = () => setIsVisible(true);

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseleave", onMouseLeave);
        document.addEventListener("mouseenter", onMouseEnter);

        let animationFrameId: number;

        const animate = () => {
            // Lower value = more lag/smoothness. 0.4 is snappier but still smooth.
            const lerpFactor = 0.4;

            delayedPos.current.x += (mousePos.current.x - delayedPos.current.x) * lerpFactor;
            delayedPos.current.y += (mousePos.current.y - delayedPos.current.y) * lerpFactor;

            if (cursorRef.current) {
                // Apply the transform. We translate by -1px to avoid edge flickering
                cursorRef.current.style.transform = `translate3d(${delayedPos.current.x}px, ${delayedPos.current.y}px, 0)`;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseleave", onMouseLeave);
            document.removeEventListener("mouseenter", onMouseEnter);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isVisible]);

    // Check if on client to avoid SSR issues
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                html, body, * {
                    cursor: none !important;
                }
            `}} />
            <div
                ref={cursorRef}
                className="pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transition: "opacity 0.2s ease-in-out",
                }}
            >
                <div 
                    className="fill-[var(--color-foreground)]"
                    style={{
                        transform: `scale(${isPointer ? 1.25 : 1})`,
                        transition: "transform 0.15s ease-out"
                    }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M0,0 v17.5 l5,-5 h8 L0,0 z"
                            fill="currentColor"
                            stroke="#fffeee"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </>
    );
}
