"use client";

import { useEffect, useRef } from "react";

class Dot {
    x: number;
    y: number;
    originX: number;
    originY: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.originX = x;
        this.originY = y;
    }

    update(mouseX: number, mouseY: number) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Repulsion logic
        const hoverRadius = 150;
        const maxRepulsion = 30;

        let targetX = this.originX;
        let targetY = this.originY;

        if (dist < hoverRadius) {
            // Calculate force based on proximity to mouse
            const force = (hoverRadius - dist) / hoverRadius;

            // Calculate repulsion vector
            const angle = Math.atan2(dy, dx);
            // We want to move AWAY from the mouse, so we subtract
            const repX = Math.cos(angle) * force * maxRepulsion;
            const repY = Math.sin(angle) * force * maxRepulsion;

            targetX = this.originX - repX;
            targetY = this.originY - repY;
        }

        // Spring interpolation back to target position
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;

        // Calculate dynamic styles based on how far we are displaced from origin
        // or how close we are to the mouse
        const distFromMouse = Math.sqrt(
            (mouseX - this.x) * (mouseX - this.x) + (mouseY - this.y) * (mouseY - this.y)
        );

        let radius = 1; // Default size
        let opacity = 0.2; // Default opacity

        if (distFromMouse < hoverRadius) {
            const effectIntensity = (hoverRadius - distFromMouse) / hoverRadius;
            radius = 1 + effectIntensity * 0.5; // Increases from 1 to 1.5
            opacity = 0.2 + effectIntensity * 0.6; // Increases from 0.2 up to 0.8
        }

        return { radius, opacity };
    }

    draw(ctx: CanvasRenderingContext2D, radius: number, opacity: number) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(80, 46, 46, ${opacity})`;
        ctx.fill();
        ctx.closePath();
    }
}

export default function InteractiveBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let dots: Dot[] = [];

        // Track mouse position
        let mouseX = -1000;
        let mouseY = -1000;

        const spacing = 40;

        const initGrid = () => {
            dots = [];
            const cols = Math.ceil(window.innerWidth / spacing);
            const rows = Math.ceil(window.innerHeight / spacing);

            // Create a straight x/y aligned grid
            for (let i = 0; i <= cols; i++) {
                for (let j = 0; j <= rows; j++) {
                    dots.push(new Dot(i * spacing, j * spacing));
                }
            }
        };

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Handle scaling properly
            initGrid();
        };

        window.addEventListener("resize", resize);
        resize(); // initial setup

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const handleMouseLeave = () => {
            mouseX = -1000;
            mouseY = -1000;
        }

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        const animate = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); // Use window sizes for clearRect because of the scale transform

            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                const { radius, opacity } = dot.update(mouseX, mouseY);
                dot.draw(ctx, radius, opacity);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-0 h-full w-full"
        />
    );
}
