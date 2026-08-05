"use client";

import { Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import HeroAttractionPlaceholder from "@/components/HeroAttractionPlaceholder";
import HologramGlbModel, { preloadGlbModel } from "@/components/HologramGlbModel";
import { type HeroAttractionInteractionRef } from "@/components/heroAttractionYaw";

const ATTRACTION_MODEL_PATH = "/models/icosphere.glb";
const ATTRACTION_MODEL_SCALE = 0.9;

/** Resting camera: icosphere framed from a distance. */
const CAMERA_RESTING_Z = 6.5;
const CAMERA_RESTING_FOV = 30;
/** Zoomed camera: dollied inside the shell (FOV stays fixed to avoid a vertigo/dolly-zoom feel). */
const CAMERA_ZOOMED_Z = 0.18;
/** Higher = snappier easing toward the target. Critically damped, so it never overshoots. */
const CAMERA_DAMP_RATE_IN = 6;
/** Slower pull-out so it lingers in step with the reversed zoom SFX. */
const CAMERA_DAMP_RATE_OUT = 2.4;

/** Stable identity so R3F only applies it once (no reset on re-render). */
const CAMERA_CONFIG = {
    position: [0, 0, CAMERA_RESTING_Z] as [number, number, number],
    fov: CAMERA_RESTING_FOV,
    near: 0.01,
    far: 100,
};

/** Warm Draco + GLB cache when nav hover begins (safe outside Canvas). */
export function preloadHeroAttractionAssets() {
    preloadGlbModel(ATTRACTION_MODEL_PATH);
}

/** Smoothly dollies the camera into / out of the icosphere when `active` toggles. */
function CameraZoomController({ active }: { active: boolean }) {
    const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
    const invalidate = useThree((state) => state.invalidate);

    useFrame((_, delta) => {
        const targetZ = active ? CAMERA_ZOOMED_Z : CAMERA_RESTING_Z;
        const dampRate = active ? CAMERA_DAMP_RATE_IN : CAMERA_DAMP_RATE_OUT;
        const nextZ = THREE.MathUtils.damp(camera.position.z, targetZ, dampRate, delta);

        if (Math.abs(nextZ - camera.position.z) > 1e-4) {
            camera.position.z = nextZ;
            camera.updateProjectionMatrix();
            invalidate();
        }
    });

    return null;
}

type HeroAttractionCanvasProps = {
    interactionRef: HeroAttractionInteractionRef;
    isReady: boolean;
    onReady?: () => void;
    /** When true, dolly the camera inside the icosphere. */
    zoomIn?: boolean;
};

export default function HeroAttractionCanvas({
    interactionRef,
    isReady,
    onReady,
    zoomIn = false,
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
                camera={CAMERA_CONFIG}
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.4,
                }}
            >
                <CameraZoomController active={zoomIn} />
                <Suspense fallback={null}>
                    <HologramGlbModel
                        modelPath={ATTRACTION_MODEL_PATH}
                        scale={ATTRACTION_MODEL_SCALE}
                        interactionRef={interactionRef}
                        onReady={onReady}
                        dimmed={zoomIn}
                    />
                </Suspense>
            </Canvas>
        </>
    );
}
