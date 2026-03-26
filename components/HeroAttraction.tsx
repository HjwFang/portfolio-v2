"use client";

import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";
import ArmillarySphere from "@/components/ArmillarySphere";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThemeForegroundLinearColor } from "@/components/useThemeColor";
import {
    applyAttractionRotation,
    ATTRACTION_DRAG_DIAGONAL_ROLL_FACTOR,
    ATTRACTION_DRAG_SENSITIVITY,
    ATTRACTION_DRAG_TWIST_FACTOR,
    type HeroAttractionInteractionRef,
} from "@/components/heroAttractionYaw";

/** Root scale on icosphere.glb; pattern freq uses 1/this so scanlines match mesh size. */
const ICOSPHERE_DISPLAY_SCALE = 0.9;

function IcosphereModel({ interactionRef }: { interactionRef: HeroAttractionInteractionRef }) {
    const { scene } = useGLTF("/icosphere.glb");
    const groupRef = useRef<THREE.Group>(null);
    const themeColor = useThemeForegroundLinearColor();
    const edgeMaterialsRef = useRef<THREE.LineBasicMaterial[]>([]);

    const hologramMaterial = useMemo(() => {
        const uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#502e2e") },
            uPatternScale: { value: 1.0 / ICOSPHERE_DISPLAY_SCALE },
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

        // Fresnel rim glow: invert dot(n, vDir) so edges are bright.
        float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.0);

        // Derive per-face plane + hash so each triangle has stable, crisp line orientation.
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

        // Flicker: brief opacity drop to 0.4 for ~80ms every few seconds.
        float period = 3.0;
        float within = mod(uTime, period);
        float gateTime = step(within, 0.08); // ~80ms window
        float sineGate = step(0.92, sin(uTime * (6.28318530718 / period))); // thresholded sine
        float flickerFactor = mix(1.0, 0.4, gateTime * sineGate);

        // Transparent hologram base fill + rim glow.
        float baseOpacity = 0.015;
        float alpha = baseOpacity + fresnel * 0.25 + scanAlpha + hatchAlpha;
        alpha *= flickerFactor;

        // Slightly brighten rim while keeping the brown hologram on-theme.
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
    }, []);

    useEffect(() => {
        edgeMaterialsRef.current = [];
        const created: { mesh: THREE.Mesh; line: THREE.LineSegments }[] = [];

        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = hologramMaterial;
                mesh.material.needsUpdate = true;
                mesh.castShadow = false;
                mesh.receiveShadow = false;

                // Full triangle-edge outline (all icosphere edges)
                const wireGeo = new THREE.WireframeGeometry(mesh.geometry);
                const wireMat = new THREE.LineBasicMaterial({
                    color: new THREE.Color("#502e2e"),
                    transparent: true,
                    opacity: 0.92,
                    depthTest: true,
                    depthWrite: false,
                    toneMapped: false,
                });
                edgeMaterialsRef.current.push(wireMat);
                const edges = new THREE.LineSegments(wireGeo, wireMat);
                edges.name = "IcosphereEdgeOverlay";
                edges.renderOrder = 1;
                mesh.add(edges);
                created.push({ mesh, line: edges });
            }
        });

        return () => {
            for (const { mesh, line } of created) {
                mesh.remove(line);
                line.geometry.dispose();
                (line.material as THREE.LineBasicMaterial).dispose();
            }
            edgeMaterialsRef.current = [];
        };
    }, [scene, hologramMaterial]);

    useEffect(() => {
        return () => {
            hologramMaterial.dispose();
        };
    }, [hologramMaterial]);

    useFrame((state, delta) => {
        hologramMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        hologramMaterial.uniforms.uColor.value.copy(themeColor);
        for (const mat of edgeMaterialsRef.current) {
            mat.color.copy(themeColor);
        }
        if (groupRef.current) {
            applyAttractionRotation(groupRef.current, interactionRef.current, delta);
        }
    });

    return (
        <group ref={groupRef} dispose={null} position={[0, 0, 0]} rotation={[0.2, 0, 0]}>
            {/* GLB was scaled to 2.8 — dominated the card; keep it a clear “hero” accent, not a fullscreen slab */}
            <primitive object={scene} scale={ICOSPHERE_DISPLAY_SCALE} />
        </group>
    );
}

useGLTF.preload("/icosphere.glb");

export default function HeroAttraction() {
    const heroNavHoverCtx = useHeroNavHoverContext();
    const hoveredIndex = heroNavHoverCtx?.hoveredIndex ?? -1;
    const isProjectsHovered = hoveredIndex === 0;
    const isMiscGalleryHovered = hoveredIndex === 2;

    const isAnyAttractionHovered = isProjectsHovered || isMiscGalleryHovered;

    const attractionInteractionRef = useRef({
        dragging: false,
        lastClientX: 0,
        lastClientY: 0,
        prevSegDx: 0,
        prevSegDy: 0,
        pendingX: 0,
        pendingY: 0,
        pendingZ: 0,
    });

    const onAttractionPointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const ir = attractionInteractionRef.current;
        ir.dragging = true;
        ir.lastClientX = e.clientX;
        ir.lastClientY = e.clientY;
        ir.prevSegDx = 0;
        ir.prevSegDy = 0;
    };

    const onAttractionPointerMove = (e: React.PointerEvent) => {
        const ir = attractionInteractionRef.current;
        if (!ir.dragging) return;
        const dx = e.clientX - ir.lastClientX;
        const dy = e.clientY - ir.lastClientY;
        ir.lastClientX = e.clientX;
        ir.lastClientY = e.clientY;
        const s = ATTRACTION_DRAG_SENSITIVITY;
        ir.pendingY += dx * s;
        ir.pendingX -= dy * s;
        const twist = ir.prevSegDx * dy - ir.prevSegDy * dx;
        ir.pendingZ +=
            twist * ATTRACTION_DRAG_TWIST_FACTOR + dx * dy * ATTRACTION_DRAG_DIAGONAL_ROLL_FACTOR;
        ir.prevSegDx = dx;
        ir.prevSegDy = dy;
    };

    const onAttractionPointerUp = (e: React.PointerEvent) => {
        attractionInteractionRef.current.dragging = false;
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* capture may already be released */
        }
    };

    return (
        <div className="w-full flex items-center justify-center">
            <CrossingCornerBorder
                bleed="clamp(3px, 0.3125vw, 6px)"
                thickness="clamp(1px, 0.052vw, 1.5px)"
                className="w-full lg:w-full lg:h-[70vh] aspect-4/3 lg:aspect-auto"
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

                    {isProjectsHovered ? (
                        <>
                            <div
                                className="absolute inset-0 z-[5] cursor-grab touch-none select-none active:cursor-grabbing"
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
                            <Canvas
                                className="absolute inset-0 z-0 pointer-events-none"
                                gl={{
                                    antialias: true,
                                    toneMapping: THREE.ACESFilmicToneMapping,
                                    toneMappingExposure: 1.4,
                                }}
                            >
                                <PerspectiveCamera
                                    makeDefault
                                    position={[0, 0, 6.5]}
                                    fov={30}
                                    near={0.1}
                                    far={100}
                                />
                                <IcosphereModel interactionRef={attractionInteractionRef} />
                            </Canvas>

                            <div className="relative z-20 flex flex-col items-center gap-4 pointer-events-none" />
                        </>
                    ) : isMiscGalleryHovered ? (
                        <>
                            <Canvas
                                className="absolute inset-0 z-0 pointer-events-none"
                                gl={{
                                    antialias: true,
                                    toneMapping: THREE.ACESFilmicToneMapping,
                                    toneMappingExposure: 1.2,
                                }}
                            >
                                <PerspectiveCamera
                                    makeDefault
                                    position={[0, 0, 4.8]}
                                    fov={38}
                                    near={0.1}
                                    far={100}
                                />
                                <group scale={2.55}>
                                    <ArmillarySphere interactionRef={attractionInteractionRef} />
                                </group>
                            </Canvas>

                            <div
                                className="absolute inset-0 z-[15] cursor-grab touch-none select-none active:cursor-grabbing"
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

                            <div className="relative z-20 flex flex-col items-center gap-4 pointer-events-none" />
                        </>
                    ) : (
                        <>
                            <div className="relative z-20 flex flex-col items-center gap-4">
                                <div
                                    className="size-12 lg:size-16 rounded-full border border-foreground/10 opacity-80 flex items-center justify-center transition-all duration-300"
                                >
                                    <div className="size-2 lg:size-3 rounded-full transition-colors duration-300 bg-foreground/20" />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </CrossingCornerBorder>
        </div>
    );
}
