"use client";

import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";
import { ATTRACTION_DRAG_SENSITIVITY } from "@/components/heroAttractionYaw";
import { NowPlaying } from "@/components/NowPlaying";
import { X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/** A tap counts as a click (not a drag) when it barely moves and is brief. */
const CLICK_MAX_TRAVEL_PX = 6;
const CLICK_MAX_DURATION_MS = 300;
/** Delay before revealing the tracklist, so the camera finishes diving inside first. */
const TRACKLIST_REVEAL_DELAY_MS = 420;

const HeroAttractionCanvas = dynamic(() => import("@/components/HeroAttractionCanvas"), {
    ssr: false,
});

export default function HeroAttraction() {
    const heroNavHoverCtx = useHeroNavHoverContext();
    const hoveredIndex = heroNavHoverCtx?.hoveredIndex ?? -1;
    const isAnyAttractionHovered = hoveredIndex !== -1;
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [showNowPlaying, setShowNowPlaying] = useState(false);
    const [tracklistVisible, setTracklistVisible] = useState(false);

    /** Tracks pointer travel so a tap can be told apart from an arcball drag. */
    const tapTrackerRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, startTime: 0, travel: 0 });

    // Reveal the tracklist only after the zoom-in settles; hide it immediately on close.
    useEffect(() => {
        if (!showNowPlaying) {
            setTracklistVisible(false);
            return;
        }
        const timer = setTimeout(() => setTracklistVisible(true), TRACKLIST_REVEAL_DELAY_MS);
        return () => clearTimeout(timer);
    }, [showNowPlaying]);

    useEffect(() => {
        if (!isAnyAttractionHovered) {
            setIsCanvasReady(false);
            return;
        }

        void import("@/components/HeroAttractionCanvas").then((mod) => {
            mod.preloadHeroAttractionAssets();
        });
    }, [isAnyAttractionHovered]);

    const attractionInteractionRef = useRef({
        dragging: false,
        prevArcX: 0,
        prevArcY: 0,
        prevArcZ: 1,
        hasPrevArc: false,
        pendingX: 0,
        pendingY: 0,
        pendingZ: 0,
    });

    // --- Drag hum: loop + smoothed envelope (no clip restarts / random jumps). ---
    const swingAudioRef = useRef<HTMLAudioElement | null>(null);
    const dragActiveForAudioRef = useRef(false);
    const audioPeakRef = useRef(0);
    const audioDisplayRef = useRef(0);
    const audioRafRef = useRef<number | null>(null);

    /** Maps arcball step angle (~0–0.3 typical) into a 0–1-ish drive for the hum. */
    const ANGLE_TO_AUDIO_PEAK = 10;
    const AUDIO_PEAK_DECAY = 0.93;
    const AUDIO_DISPLAY_LERP = 0.16;

    useEffect(() => {
        const swing = new Audio("/sounds/dragon-studio-hum-390295.mp3");
        swing.loop = true;
        swing.volume = 0;
        swingAudioRef.current = swing;

        return () => {
            if (audioRafRef.current != null) {
                cancelAnimationFrame(audioRafRef.current);
                audioRafRef.current = null;
            }
            swing.pause();
        };
    }, []);

    const ensureAudioSmoothingLoop = () => {
        if (audioRafRef.current != null) return;

        const tick = () => {
            const swing = swingAudioRef.current;
            audioPeakRef.current *= AUDIO_PEAK_DECAY;
            const target = audioPeakRef.current;
            audioDisplayRef.current += (target - audioDisplayRef.current) * AUDIO_DISPLAY_LERP;

            if (swing) {
                const d = audioDisplayRef.current;
                if (d > 0.012) {
                    if (swing.paused) {
                        swing.play().catch(() => {});
                    }
                    swing.volume = Math.min(0.42, d * 0.5);
                    swing.playbackRate = 0.9 + d * 0.28;
                } else {
                    swing.volume = 0;
                }
            }

            const keepGoing =
                dragActiveForAudioRef.current ||
                audioPeakRef.current > 0.004 ||
                audioDisplayRef.current > 0.015;
            if (keepGoing) {
                audioRafRef.current = requestAnimationFrame(tick);
            } else {
                audioRafRef.current = null;
            }
        };

        audioRafRef.current = requestAnimationFrame(tick);
    };

    const bumpDragAudioFromAngle = (angle: number) => {
        const bump = Math.min(1, angle * ANGLE_TO_AUDIO_PEAK);
        audioPeakRef.current = Math.max(audioPeakRef.current, bump);
        ensureAudioSmoothingLoop();
    };

    const pointerToArcball = (e: React.PointerEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        const len2 = nx * nx + ny * ny;
        if (len2 <= 1) {
            return { x: nx, y: ny, z: Math.sqrt(1 - len2) };
        }
        const invLen = 1 / Math.sqrt(len2);
        return { x: nx * invLen, y: ny * invLen, z: 0 };
    };

    const onAttractionPointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragActiveForAudioRef.current = true;
        const ir = attractionInteractionRef.current;
        ir.dragging = true;
        const v = pointerToArcball(e);
        ir.prevArcX = v.x;
        ir.prevArcY = v.y;
        ir.prevArcZ = v.z;
        ir.hasPrevArc = true;

        const tap = tapTrackerRef.current;
        tap.startX = e.clientX;
        tap.startY = e.clientY;
        tap.lastX = e.clientX;
        tap.lastY = e.clientY;
        tap.startTime = performance.now();
        tap.travel = 0;

        // Warm up audio to unlock browser autoplay policy
        if (swingAudioRef.current && swingAudioRef.current.paused) {
            swingAudioRef.current.volume = 0;
            swingAudioRef.current.play().then(() => {
                swingAudioRef.current?.pause();
            }).catch(() => {});
        }
    };

    const onAttractionPointerMove = (e: React.PointerEvent) => {
        const ir = attractionInteractionRef.current;
        if (!ir.dragging || !ir.hasPrevArc) return;

        const tap = tapTrackerRef.current;
        tap.travel += Math.hypot(e.clientX - tap.lastX, e.clientY - tap.lastY);
        tap.lastX = e.clientX;
        tap.lastY = e.clientY;

        const curr = pointerToArcball(e);

        const px = ir.prevArcX;
        const py = ir.prevArcY;
        const pz = ir.prevArcZ;
        const cx = curr.x;
        const cy = curr.y;
        const cz = curr.z;

        // Axis in view-space from previous-to-current arcball vectors.
        const ax = py * cz - pz * cy;
        const ay = pz * cx - px * cz;
        const az = px * cy - py * cx;
        const axisLen = Math.hypot(ax, ay, az);
        if (axisLen > 1e-6) {
            const dot = Math.max(-1, Math.min(1, px * cx + py * cy + pz * cz));
            const angle = Math.atan2(axisLen, dot) * ATTRACTION_DRAG_SENSITIVITY;
            const invAxisLen = 1 / axisLen;
            ir.pendingX += ax * invAxisLen * angle;
            ir.pendingY += ay * invAxisLen * angle;
            ir.pendingZ += az * invAxisLen * angle;

            bumpDragAudioFromAngle(angle);
        }

        ir.prevArcX = cx;
        ir.prevArcY = cy;
        ir.prevArcZ = cz;
    };

    const onAttractionPointerUp = (e: React.PointerEvent) => {
        const ir = attractionInteractionRef.current;
        ir.dragging = false;
        ir.hasPrevArc = false;
        dragActiveForAudioRef.current = false;
        ensureAudioSmoothingLoop();

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* capture may already be released */
        }

        // A genuine pointerup that barely moved is a tap → toggle the Spotify panel.
        if (e.type === "pointerup") {
            const tap = tapTrackerRef.current;
            const dist = Math.hypot(e.clientX - tap.startX, e.clientY - tap.startY);
            const duration = performance.now() - tap.startTime;
            const isTap =
                tap.travel < CLICK_MAX_TRAVEL_PX &&
                dist < CLICK_MAX_TRAVEL_PX &&
                duration < CLICK_MAX_DURATION_MS;
            if (isTap) {
                setShowNowPlaying((prev) => !prev);
            }
        }
    };

    return (
        <div className="w-full flex items-center justify-center">
            <CrossingCornerBorder
                bleed="clamp(3px, 0.3125vw, 6px)"
                thickness="clamp(1px, 0.052vw, 1.5px)"
                className="w-full aspect-square max-h-[25vh] lg:max-h-[32vh]"
            >
                <div
                    className={`w-full h-full flex items-center justify-center relative group overflow-hidden transition-colors duration-300 ${
                        isAnyAttractionHovered ? "bg-foreground/6" : "bg-foreground/3"
                    }`}
                >
                    <div
                        className={`pointer-events-none absolute inset-0 z-10 bg-linear-to-tr from-foreground/5 to-transparent transition-opacity duration-300 ${
                            isAnyAttractionHovered ? "opacity-70" : "opacity-50"
                        }`}
                    />

                    {/* Attraction: lazy Canvas + static placeholder until GLB is ready */}
                    <div
                        className={`absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${
                            isAnyAttractionHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                    >
                        <div
                            className="absolute inset-0 z-5 cursor-grab touch-none select-none active:cursor-grabbing"
                            onPointerDown={onAttractionPointerDown}
                            onPointerMove={onAttractionPointerMove}
                            onPointerUp={onAttractionPointerUp}
                            onPointerCancel={onAttractionPointerUp}
                            onPointerLeave={(e) => {
                                if (attractionInteractionRef.current.dragging) {
                                    onAttractionPointerUp(e);
                                }
                            }}
                        />
                        {isAnyAttractionHovered ? (
                            <HeroAttractionCanvas
                                interactionRef={attractionInteractionRef}
                                isReady={isCanvasReady}
                                onReady={() => setIsCanvasReady(true)}
                                zoomIn={showNowPlaying}
                            />
                        ) : null}
                    </div>

                    {/* Default Dot State */}
                    <div
                        className={`relative z-20 flex flex-col items-center gap-[clamp(12px,1vw,16px)] transition-opacity duration-700 ease-in-out ${
                            isAnyAttractionHovered ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                    >
                        <div
                            className="size-[clamp(48px,4vw,64px)] rounded-full border border-foreground/10 opacity-80 flex items-center justify-center transition-all duration-300"
                        >
                            <div className="size-[clamp(8px,0.7vw,12px)] rounded-full transition-colors duration-300 bg-foreground/20" />
                        </div>
                    </div>

                    {/* Spotify label: visible while the icosphere is present, hidden once entered */}
                    <span
                        className={`pointer-events-none absolute bottom-[clamp(14px,1.3vw,22px)] left-[clamp(14px,1.3vw,22px)] z-30 font-quicksand font-medium tracking-wide text-foreground/75 text-[clamp(10px,0.677vw,12px)] transition-opacity duration-500 ${
                            isAnyAttractionHovered && !showNowPlaying ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        Spotify
                    </span>

                    {/* Spotify tracklist: renders directly inside the icosphere (no box); backdrop click closes */}
                    <div
                        onClick={() => setShowNowPlaying(false)}
                        className={`absolute inset-0 z-40 flex flex-col p-[clamp(14px,1.3vw,22px)] transition-opacity duration-500 ${
                            showNowPlaying ? "opacity-100" : "pointer-events-none opacity-0"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => setShowNowPlaying(false)}
                            aria-label="Close now playing"
                            className="absolute top-[clamp(10px,0.8vw,14px)] right-[clamp(10px,0.8vw,14px)] z-10 text-foreground/40 transition-colors hover:text-foreground"
                        >
                            <X className="size-[clamp(13px,0.9vw,16px)]" strokeWidth={1.5} />
                        </button>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`min-h-0 flex-1 transition-all duration-500 ease-in-out ${
                                tracklistVisible
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-2 opacity-0"
                            }`}
                        >
                            {tracklistVisible ? <NowPlaying /> : null}
                        </div>
                    </div>

                </div>
            </CrossingCornerBorder>
        </div>
    );
}
