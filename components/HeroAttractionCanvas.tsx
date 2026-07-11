"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import HeroAttractionPlaceholder from "@/components/HeroAttractionPlaceholder";
import HologramGlbModel, { preloadGlbModel } from "@/components/HologramGlbModel";
import { type HeroAttractionInteractionRef } from "@/components/heroAttractionYaw";

const ATTRACTION_MODEL_PATH = "/models/icosphere.glb";
const ATTRACTION_MODEL_SCALE = 0.9;

/** Warm Draco + GLB cache when nav hover begins (safe outside Canvas). */
export function preloadHeroAttractionAssets() {
    preloadGlbModel(ATTRACTION_MODEL_PATH);
}

type HeroAttractionCanvasProps = {
    interactionRef: HeroAttractionInteractionRef;
    isReady: boolean;
    onReady?: () => void;
};

export default function HeroAttractionCanvas({
    interactionRef,
    isReady,
    onReady,
}: HeroAttractionCanvasProps) {
    return (
        <>
            <HeroAttractionPlaceholder
                className={`z-1 transition-opacity duration-500 ${isReady ? "opacity-0" : "opacity-100"}`}
            />

            <Canvas
                className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${
                    isReady ? "opacity-100" : "opacity-0"
                }`}
                frameloop="demand"
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.4,
                }}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 6.5]} fov={30} near={0.1} far={100} />
                <Suspense fallback={null}>
                    <HologramGlbModel
                        modelPath={ATTRACTION_MODEL_PATH}
                        scale={ATTRACTION_MODEL_SCALE}
                        interactionRef={interactionRef}
                        onReady={onReady}
                    />
                </Suspense>
            </Canvas>
        </>
    );
}
