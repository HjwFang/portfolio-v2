"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useThemeForegroundLinearColor } from "@/components/useThemeColor";
import {
    applyAttractionRotation,
    ATTRACTION_DRAG_SENSITIVITY,
    type HeroAttractionInteractionRef,
} from "@/components/heroAttractionYaw";

/** A tap counts as a click (not a drag) when it barely moves and is brief. */
const CLICK_MAX_TRAVEL_PX = 6;
const CLICK_MAX_DURATION_MS = 300;

/** Warm Draco + GLB cache when a model path is known (safe outside Canvas). */
export function preloadGlbModel(modelPath: string) {
    useGLTF.preload(modelPath, true, false);
}

function createHologramMaterial(patternScale: number) {
    const uniforms = {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#502e2e") },
        uPatternScale: { value: patternScale },
        uOpacity: { value: 1 },
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
      uniform float uOpacity;

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

        gl_FragColor = vec4(color, alpha * uOpacity);
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

/** Edge line opacity at rest vs. when dimmed. */
const EDGE_OPACITY_RESTING = 0.92;
const EDGE_OPACITY_DIMMED = 0.12;
/** Shader fill multiplier when dimmed (1 = full at rest). */
const FILL_OPACITY_DIMMED = 0.12;
/** Higher = faster fade toward the target opacity. */
const OPACITY_DAMP_RATE = 4;

export type HologramGlbModelProps = {
    modelPath: string;
    /** Root scale on the loaded GLB; pattern freq uses 1/this so scanlines match mesh size. */
    scale?: number;
    interactionRef: HeroAttractionInteractionRef;
    onReady?: () => void;
    rotation?: [number, number, number];
    /** Fade the hologram down (e.g. while zoomed inside it). */
    dimmed?: boolean;
    /** Fired on a short tap that lands on the mesh (not the empty frame). */
    onTap?: () => void;
    /** Fired on pointerdown so parent can unlock audio / prime gesture work. */
    onGestureStart?: () => void;
};

export default function HologramGlbModel({
    modelPath,
    scale = 1,
    interactionRef,
    onReady,
    rotation = [0.2, 0, 0],
    dimmed = false,
    onTap,
    onGestureStart,
}: HologramGlbModelProps) {
    const { scene } = useGLTF(modelPath, true, false);
    const groupRef = useRef<THREE.Group>(null);
    const themeColor = useThemeForegroundLinearColor();
    const gl = useThree((state) => state.gl);
    const invalidate = useThree((state) => state.invalidate);
    const readyNotifiedRef = useRef(false);
    const tapTrackerRef = useRef({
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        startTime: 0,
        travel: 0,
        /** True while a touch is down on the mesh (tap candidate; no drag). */
        touchPending: false,
    });
    const onTapRef = useRef(onTap);
    const onGestureStartRef = useRef(onGestureStart);
    onTapRef.current = onTap;
    onGestureStartRef.current = onGestureStart;

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
            // Edges are decorative — only the mesh surface should receive hits.
            edges.raycast = () => {};
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

    const pointerToArcball = (clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
        const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
        const len2 = nx * nx + ny * ny;
        if (len2 <= 1) {
            return { x: nx, y: ny, z: Math.sqrt(1 - len2) };
        }
        const invLen = 1 / Math.sqrt(len2);
        return { x: nx * invLen, y: ny * invLen, z: 0 };
    };

    const setCanvasCursor = (cursor: string) => {
        // Only invoked from pointer event handlers, never during render, so
        // mutating the canvas DOM element here is a safe imperative side effect.
        // eslint-disable-next-line react-hooks/immutability
        gl.domElement.style.cursor = cursor;
    };

    // Move/up on the canvas so drag continues after the pointer leaves the mesh silhouette.
    useEffect(() => {
        const el = gl.domElement;

        const toArcball = (clientX: number, clientY: number) => {
            const rect = el.getBoundingClientRect();
            const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
            const len2 = nx * nx + ny * ny;
            if (len2 <= 1) {
                return { x: nx, y: ny, z: Math.sqrt(1 - len2) };
            }
            const invLen = 1 / Math.sqrt(len2);
            return { x: nx * invLen, y: ny * invLen, z: 0 };
        };

        const onPointerMove = (e: PointerEvent) => {
            const tap = tapTrackerRef.current;
            if (tap.touchPending) {
                tap.travel += Math.hypot(e.clientX - tap.lastX, e.clientY - tap.lastY);
                tap.lastX = e.clientX;
                tap.lastY = e.clientY;
                return;
            }

            const ir = interactionRef.current;
            if (!ir.dragging || !ir.hasPrevArc) return;

            tap.travel += Math.hypot(e.clientX - tap.lastX, e.clientY - tap.lastY);
            tap.lastX = e.clientX;
            tap.lastY = e.clientY;

            const curr = toArcball(e.clientX, e.clientY);
            const px = ir.prevArcX;
            const py = ir.prevArcY;
            const pz = ir.prevArcZ;
            const cx = curr.x;
            const cy = curr.y;
            const cz = curr.z;

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

        const finishTapIfNeeded = (e: PointerEvent) => {
            const tap = tapTrackerRef.current;
            const dist = Math.hypot(e.clientX - tap.startX, e.clientY - tap.startY);
            const duration = performance.now() - tap.startTime;
            const isTap =
                tap.travel < CLICK_MAX_TRAVEL_PX &&
                dist < CLICK_MAX_TRAVEL_PX &&
                duration < CLICK_MAX_DURATION_MS;
            if (isTap) onTapRef.current?.();
        };

        const onPointerUp = (e: PointerEvent) => {
            const tap = tapTrackerRef.current;
            if (tap.touchPending) {
                tap.touchPending = false;
                if (e.type === "pointerup") finishTapIfNeeded(e);
                return;
            }

            const ir = interactionRef.current;
            if (!ir.dragging) return;

            ir.dragging = false;
            ir.hasPrevArc = false;
            el.style.cursor = "default";

            try {
                if (el.hasPointerCapture(e.pointerId)) {
                    el.releasePointerCapture(e.pointerId);
                }
            } catch {
                /* capture may already be released */
            }

            if (e.type === "pointerup") finishTapIfNeeded(e);
        };

        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", onPointerUp);
        el.addEventListener("pointercancel", onPointerUp);
        // Touch taps don't use setPointerCapture, so up/cancel may land outside the canvas.
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        return () => {
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", onPointerUp);
            el.removeEventListener("pointercancel", onPointerUp);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
            el.style.cursor = "";
        };
    }, [gl, interactionRef]);

    const onMeshPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();

        const tap = tapTrackerRef.current;
        tap.startX = e.clientX;
        tap.startY = e.clientY;
        tap.lastX = e.clientX;
        tap.lastY = e.clientY;
        tap.startTime = performance.now();
        tap.travel = 0;

        onGestureStartRef.current?.();

        // Touch: track for tap only — don't capture or drag, so the page can scroll.
        if (e.pointerType === "touch") {
            const ir = interactionRef.current;
            ir.dragging = false;
            ir.hasPrevArc = false;
            tap.touchPending = true;
            return;
        }

        tap.touchPending = false;

        const el = gl.domElement;
        el.setPointerCapture(e.pointerId);
        setCanvasCursor("grabbing");

        const ir = interactionRef.current;
        ir.dragging = true;
        const v = pointerToArcball(e.clientX, e.clientY);
        ir.prevArcX = v.x;
        ir.prevArcY = v.y;
        ir.prevArcZ = v.z;
        ir.hasPrevArc = true;
    };

    const onMeshPointerOver = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (!interactionRef.current.dragging) setCanvasCursor("grab");
    };

    const onMeshPointerOut = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (!interactionRef.current.dragging) setCanvasCursor("default");
    };

    useFrame((state, delta) => {
        // useFrame runs outside React's render/commit cycle, so mutating these
        // useMemo'd three.js materials here is the standard r3f animation-loop
        // pattern, not a render-safety violation the immutability rule assumes.
        // eslint-disable-next-line react-hooks/immutability
        hologramMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        hologramMaterial.uniforms.uColor.value.copy(themeColor);
        edgeMaterial.color.copy(themeColor);

        const targetFill = dimmed ? FILL_OPACITY_DIMMED : 1;
        const targetEdge = dimmed ? EDGE_OPACITY_DIMMED : EDGE_OPACITY_RESTING;
        hologramMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(
            hologramMaterial.uniforms.uOpacity.value,
            targetFill,
            OPACITY_DAMP_RATE,
            delta,
        );
        // eslint-disable-next-line react-hooks/immutability
        edgeMaterial.opacity = THREE.MathUtils.damp(
            edgeMaterial.opacity,
            targetEdge,
            OPACITY_DAMP_RATE,
            delta,
        );

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
        <group
            ref={groupRef}
            dispose={null}
            position={[0, 0, 0]}
            rotation={rotation}
            onPointerDown={onMeshPointerDown}
            onPointerOver={onMeshPointerOver}
            onPointerOut={onMeshPointerOut}
        >
            <primitive object={modelRoot} scale={scale} />
        </group>
    );
}
