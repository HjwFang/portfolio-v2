"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useThemeForegroundLinearColor } from "@/components/useThemeColor";
import {
    applyAttractionRotation,
    ATTRACTION_IDLE_YAW_RAD_PER_SEC,
    type HeroAttractionInteractionRef,
} from "@/components/heroAttractionYaw";

/** Baked torus scale; scan frequency uses 1/this so line density matches a “unit” design. */
const ARMILLARY_MODEL_SCALE = 0.26;

type ArmillarySphereProps = {
    interactionRef?: HeroAttractionInteractionRef;
};

export default function ArmillarySphere({ interactionRef }: ArmillarySphereProps = {}) {
    const groupRef = useRef<THREE.Group>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const ring3Ref = useRef<THREE.Mesh>(null);
    const ring4Ref = useRef<THREE.Mesh>(null);
    const ring5Ref = useRef<THREE.Mesh>(null);
    const themeColor = useThemeForegroundLinearColor();

    const hologramMaterial = useMemo(() => {
        const uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#502e2e") },
            uPatternScale: { value: 1.0 / ARMILLARY_MODEL_SCALE },
        };

        const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;

      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vLocalPos = position;

        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec3 uColor;
      uniform float uPatternScale;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;

      void main() {
        vec3 baseColor = uColor;

        float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.0);

        // Object-space bands: follow each mesh/triangle instead of world-space projection.
        float scanFreq = 105.0 * uPatternScale;
        float scan = sin(vLocalPos.y * scanFreq + uTime * 2.0);
        float scanPeaks = smoothstep(0.75, 1.0, scan);
        float scanAlpha = scanPeaks * 0.15;

        float hatchFreq = 52.0 * uPatternScale;
        vec3 lp = vLocalPos;
        float diag = sin((lp.x - lp.y) * hatchFreq + uTime * 0.35);
        float hatchPeaks = smoothstep(0.78, 1.0, diag);
        float hatchAlpha = hatchPeaks * 0.12;

        float period = 3.0;
        float within = mod(uTime, period);
        float gateTime = step(within, 0.08);
        float sineGate = step(0.92, sin(uTime * (6.28318530718 / period)));
        float flickerFactor = mix(1.0, 0.4, gateTime * sineGate);

        float baseOpacity = 0.045;
        float alpha = baseOpacity + fresnel * 0.25 + scanAlpha + hatchAlpha;
        alpha *= flickerFactor;

        vec3 color = baseColor * (0.62 + fresnel * 2.0 + hatchPeaks * 0.15);

        gl_FragColor = vec4(color, alpha);
      }
    `;

        return new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
        });
    }, []);

    useEffect(() => {
        return () => {
            hologramMaterial.dispose();
        };
    }, [hologramMaterial]);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        hologramMaterial.uniforms.uTime.value = t;
        hologramMaterial.uniforms.uColor.value.copy(themeColor);

        const g = groupRef.current;
        if (g) {
            if (interactionRef) {
                applyAttractionRotation(g, interactionRef.current, delta);
            } else {
                g.rotation.y += delta * ATTRACTION_IDLE_YAW_RAD_PER_SEC;
            }
        }

        const r1 = ring1Ref.current;
        if (r1) r1.rotation.set(0, t * 0.3, 0);

        const r2 = ring2Ref.current;
        if (r2) r2.rotation.set(Math.PI / 2 + t * 0.2, 0, 0);

        const r3 = ring3Ref.current;
        if (r3) r3.rotation.set(0, 0, Math.PI / 3 + t * 0.15);

        const r4 = ring4Ref.current;
        if (r4) r4.rotation.set(Math.PI / 4 + t * 0.1, Math.PI / 4 + t * 0.1, 0);

        const r5 = ring5Ref.current;
        if (r5) r5.rotation.set(Math.PI / 3, Math.PI / 6, Math.PI / 4 + t * 0.25);
    });

    const radii = [1.0, 1.0, 1.0, 0.7, 0.5].map((r) => r * ARMILLARY_MODEL_SCALE);
    const tubeArgs = [0.012 * ARMILLARY_MODEL_SCALE, 4, 128] as [number, number, number];

    return (
        <group ref={groupRef} rotation={[0.2, 0, 0]}>
            <mesh ref={ring1Ref} rotation={[0, 0, 0]} castShadow={false} receiveShadow={false}>
                <torusGeometry args={[radii[0], ...tubeArgs]} />
                <primitive object={hologramMaterial} attach="material" />
            </mesh>

            <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]} castShadow={false} receiveShadow={false}>
                <torusGeometry args={[radii[1], ...tubeArgs]} />
                <primitive object={hologramMaterial} attach="material" />
            </mesh>

            <mesh ref={ring3Ref} rotation={[0, 0, Math.PI / 3]} castShadow={false} receiveShadow={false}>
                <torusGeometry args={[radii[2], ...tubeArgs]} />
                <primitive object={hologramMaterial} attach="material" />
            </mesh>

            <mesh ref={ring4Ref} rotation={[Math.PI / 4, Math.PI / 4, 0]} castShadow={false} receiveShadow={false}>
                <torusGeometry args={[radii[3], ...tubeArgs]} />
                <primitive object={hologramMaterial} attach="material" />
            </mesh>

            <mesh ref={ring5Ref} rotation={[Math.PI / 3, Math.PI / 6, Math.PI / 4]} castShadow={false} receiveShadow={false}>
                <torusGeometry args={[radii[4], ...tubeArgs]} />
                <primitive object={hologramMaterial} attach="material" />
            </mesh>
        </group>
    );
}
