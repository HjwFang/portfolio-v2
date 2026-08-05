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
    /** Keep NowPlaying mounted after first open so reopen doesn't reload from scratch. */
    const [tracklistMounted, setTracklistMounted] = useState(false);

    /** Tracks pointer travel so a tap can be told apart from an arcball drag. */
    const tapTrackerRef = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0, startTime: 0, travel: 0 });

    // Reveal the tracklist only after the zoom-in settles; hide it immediately on close.
    useEffect(() => {
        if (!showNowPlaying) {
            setTracklistVisible(false);
            return;
        }
        setTracklistMounted(true);
        const timer = setTimeout(() => setTracklistVisible(true), TRACKLIST_REVEAL_DELAY_MS);
        return () => clearTimeout(timer);
    }, [showNowPlaying]);

    // Warm the Spotify payload while the icosphere is visible so open feels instant.
    useEffect(() => {
        if (!isAnyAttractionHovered) return;
        void fetch("/api/spotify").catch(() => {});
    }, [isAnyAttractionHovered]);

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

    // --- Zoom SFX: plays forward diving into the sphere, reversed on the way out. ---
    const audioCtxRef = useRef<AudioContext | null>(null);
    const forwardBufferRef = useRef<AudioBuffer | null>(null);
    const reversedBufferRef = useRef<AudioBuffer | null>(null);
    const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
    /** Direction requested before the buffer finished decoding. */
    const pendingDirectionRef = useRef<"forward" | "reversed" | null>(null);
    /** Skip firing the SFX for the initial (closed) render. */
    const didInitZoomStateRef = useRef(false);

    const ZOOM_SFX_VOLUME = 0.45;
    /** Playback speed per direction: normal diving in, quicker on the reversed pull-out. */
    const ZOOM_SFX_RATE_IN = 1;
    const ZOOM_SFX_RATE_OUT = 1.6;

    /** Create/resume the AudioContext and lazily decode the clip (+ a reversed copy). */
    const ensureZoomAudioReady = () => {
        if (typeof window === "undefined") return;

        if (!audioCtxRef.current) {
            const Ctor =
                window.AudioContext ??
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return;
            audioCtxRef.current = new Ctor();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume().catch(() => {});

        if (forwardBufferRef.current) return;

        fetch("/sounds/dragon-studio-hum-390295.mp3")
            .then((res) => res.arrayBuffer())
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => {
                forwardBufferRef.current = buffer;

                const reversed = ctx.createBuffer(
                    buffer.numberOfChannels,
                    buffer.length,
                    buffer.sampleRate,
                );
                for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
                    const src = buffer.getChannelData(ch);
                    const dst = reversed.getChannelData(ch);
                    for (let i = 0, j = buffer.length - 1; i < buffer.length; i++, j--) {
                        dst[i] = src[j];
                    }
                }
                reversedBufferRef.current = reversed;

                if (pendingDirectionRef.current) {
                    const dir = pendingDirectionRef.current;
                    pendingDirectionRef.current = null;
                    playZoomSfx(dir);
                }
            })
            .catch(() => {});
    };

    const playZoomSfx = (direction: "forward" | "reversed") => {
        const ctx = audioCtxRef.current;
        const buffer =
            direction === "forward" ? forwardBufferRef.current : reversedBufferRef.current;

        // Buffer may still be decoding — remember the latest request and bail.
        if (!ctx || !buffer) {
            pendingDirectionRef.current = direction;
            return;
        }
        if (ctx.state === "suspended") ctx.resume().catch(() => {});

        try {
            activeSourceRef.current?.stop();
        } catch {
            /* previous source may have already ended */
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value =
            direction === "forward" ? ZOOM_SFX_RATE_IN : ZOOM_SFX_RATE_OUT;
        const gain = ctx.createGain();
        gain.gain.value = ZOOM_SFX_VOLUME;
        source.connect(gain).connect(ctx.destination);
        source.start();
        activeSourceRef.current = source;
    };

    // Play the clip forward on zoom-in, reversed on zoom-out (any close path).
    useEffect(() => {
        if (!didInitZoomStateRef.current) {
            didInitZoomStateRef.current = true;
            return;
        }
        ensureZoomAudioReady();
        playZoomSfx(showNowPlaying ? "forward" : "reversed");
    }, [showNowPlaying]);

    useEffect(() => {
        return () => {
            try {
                activeSourceRef.current?.stop();
            } catch {
                /* nothing playing */
            }
            audioCtxRef.current?.close().catch(() => {});
        };
    }, []);

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

        // Unlock/prime the AudioContext on the user gesture so the zoom SFX can play.
        ensureZoomAudioReady();
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
        }

        ir.prevArcX = cx;
        ir.prevArcY = cy;
        ir.prevArcZ = cz;
    };

    const onAttractionPointerUp = (e: React.PointerEvent) => {
        const ir = attractionInteractionRef.current;
        ir.dragging = false;
        ir.hasPrevArc = false;

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
        <div className="w-full flex items-center justify-center md:h-full md:min-h-0">
            <CrossingCornerBorder
                bleed="clamp(3px, 0.3125vw, 6px)"
                thickness="clamp(1px, 0.052vw, 1.5px)"
                className="hero-attraction-frame w-full aspect-square max-md:aspect-auto max-md:h-[clamp(18rem,86vw,22.5rem)] md:aspect-auto md:h-full md:max-h-none"
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
                        spotify
                    </span>

                    {/* Spotify tracklist: renders directly inside the icosphere (no box); backdrop click closes */}
                    <div
                        onClick={() => setShowNowPlaying(false)}
                        className={`now-playing-panel absolute inset-0 z-40 flex flex-col transition-opacity duration-500 ${
                            showNowPlaying ? "opacity-100" : "pointer-events-none opacity-0"
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => setShowNowPlaying(false)}
                            aria-label="Close now playing"
                            className="now-playing-panel__close absolute z-10 text-foreground/40 transition-colors hover:text-foreground"
                        >
                            <X className="now-playing-panel__close-icon" strokeWidth={1.5} />
                        </button>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`now-playing-scale min-h-0 flex-1 transition-all duration-500 ease-in-out ${
                                tracklistVisible
                                    ? "translate-y-0 opacity-100"
                                    : "translate-y-2 opacity-0"
                            }`}
                        >
                            {/* Mount as soon as opened (prefetch during zoom); keep mounted after first open. */}
                            {tracklistMounted || showNowPlaying ? <NowPlaying /> : null}
                        </div>
                    </div>

                </div>
            </CrossingCornerBorder>
        </div>
    );
}
