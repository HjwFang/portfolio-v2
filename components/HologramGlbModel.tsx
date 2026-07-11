"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThemeForegroundLinearColor } from "@/components/useThemeColor";
import {
    applyAttractionRotation,
    type HeroAttractionInteractionRef,
} from "@/components/heroAttractionYaw";

/** Warm Draco + GLB cache when a model path is known (safe outside Canvas). */
export function preloadGlbModel(modelPath: string) {
    useGLTF.preload(modelPath, true, false);
}

function createHologramMaterial(patternScale: number) {
    const uniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#502e2e") },
        uPatternScale: { value: patternScale },
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

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      vec3 orthogonal(vec3 n) {
        return normalize(abs(n.z) < 0.999 ? vec3(-n.y, n.x, 0.0) : vec3(0.0, -n.z, n.y));
      }

      float crispStripe(float coord, float width) {
        float distToCenter = abs(fract(coord) - 0.5);
        float aa = max(fwidth(coord), 1e-4);
        return 1.0 - smoothstep(width - aa, width + aa, distToCenter);
      }

      void main() {
        vec3 baseColor = uColor;

        float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.0);

        vec3 dpdx = dFdx(vLocalPos);
        vec3 dpdy = dFdy(vLocalPos);
        vec3 faceN = normalize(cross(dpdx, dpdy));
        vec3 faceKey = floor(faceN * 251.0 + 0.5);
        float faceHash = hash31(faceKey);

        vec3 t = orthogonal(faceN);
        vec3 b = normalize(cross(faceN, t));
        vec2 faceUv = vec2(dot(vLocalPos, t), dot(vLocalPos, b));

        float angleA = faceHash * 6.28318530718;
        float angleB = angleA + 1.57079632679;

        float freqA = 118.0 * uPatternScale;
        float freqB = 72.0 * uPatternScale;
        float stripeA = dot(faceUv, vec2(cos(angleA), sin(angleA))) * freqA + uTime * 1.8;
        float stripeB = dot(faceUv, vec2(cos(angleB), sin(angleB))) * freqB - uTime * 0.55;

        float lineA = crispStripe(stripeA, 0.075);
        float lineB = crispStripe(stripeB + faceHash * 11.0, 0.062);
        float scanAlpha = lineA * 0.14;
        float hatchAlpha = lineB * 0.11;

        float baseOpacity = 0.015;
        float alpha = baseOpacity + fresnel * 0.25 + scanAlpha + hatchAlpha;

        vec3 color = baseColor * (0.62 + fresnel * 2.0 + lineB * 0.15);

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
}

export type HologramGlbModelProps = {
    modelPath: string;
    /** Root scale on the loaded GLB; pattern freq uses 1/this so scanlines match mesh size. */
    scale?: number;
    interactionRef: HeroAttractionInteractionRef;
    onReady?: () => void;
    rotation?: [number, number, number];
};

export default function HologramGlbModel({
    modelPath,
    scale = 1,
    interactionRef,
    onReady,
    rotation = [0.2, 0, 0],
}: HologramGlbModelProps) {
    const { scene } = useGLTF(modelPath, true, false);
    const groupRef = useRef<THREE.Group>(null);
    const themeColor = useThemeForegroundLinearColor();
    const invalidate = useThree((state) => state.invalidate);
    const readyNotifiedRef = useRef(false);

    const hologramMaterial = useMemo(() => createHologramMaterial(1.0 / scale), [scale]);

    const edgeMaterial = useMemo(
        () =>
            new THREE.LineBasicMaterial({
                color: new THREE.Color("#502e2e"),
                transparent: true,
                opacity: 0.92,
                depthTest: true,
                depthWrite: false,
                toneMapped: false,
            }),
        [],
    );

    /** Clone cached GLTF so material/edge edits never mutate the loader cache. */
    const modelRoot = useMemo(() => scene.clone(true), [scene]);

    useEffect(() => {
        const disposables: THREE.BufferGeometry[] = [];
        const edgeLines: THREE.LineSegments[] = [];

        modelRoot.traverse((child) => {
            if (!(child as THREE.Mesh).isMesh) return;

            const mesh = child as THREE.Mesh;
            mesh.material = hologramMaterial;
            mesh.castShadow = false;
            mesh.receiveShadow = false;

            const edgeGeo = new THREE.EdgesGeometry(mesh.geometry, 1);
            disposables.push(edgeGeo);

            const edges = new THREE.LineSegments(edgeGeo, edgeMaterial);
            edges.name = "HologramEdgeOverlay";
            edges.renderOrder = 1;
            mesh.add(edges);
            edgeLines.push(edges);
        });

        return () => {
            for (const line of edgeLines) {
                line.parent?.remove(line);
            }
            for (const geo of disposables) {
                geo.dispose();
            }
        };
    }, [modelRoot, hologramMaterial, edgeMaterial]);

    useEffect(() => {
        return () => {
            hologramMaterial.dispose();
            edgeMaterial.dispose();
        };
    }, [hologramMaterial, edgeMaterial]);

    useEffect(() => {
        invalidate();
    }, [themeColor, invalidate]);

    useFrame((state, delta) => {
        hologramMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        hologramMaterial.uniforms.uColor.value.copy(themeColor);
        edgeMaterial.color.copy(themeColor);

        if (groupRef.current) {
            applyAttractionRotation(groupRef.current, interactionRef.current, delta);
        }

        if (!readyNotifiedRef.current) {
            readyNotifiedRef.current = true;
            onReady?.();
        }

        invalidate();
    });

    return (
        <group ref={groupRef} dispose={null} position={[0, 0, 0]} rotation={rotation}>
            <primitive object={modelRoot} scale={scale} />
        </group>
    );
}
