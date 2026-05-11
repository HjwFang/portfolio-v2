"use client";

import { useGLTF, Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThemeForegroundLinearColor } from "@/components/useThemeColor";

function Model() {
    const { scene } = useGLTF("/star.glb");
    const groupRef = useRef<THREE.Group>(null);
    const themeColor = useThemeForegroundLinearColor();

    const hologramMaterial = useMemo(() => {
        const uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#502e2e") },
        };

        const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldPos = worldPos;

        // World-space normal for a stable fresnel term.
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

        const fragmentShader = `
      precision highp float;

      uniform float uTime;
      uniform vec3 uColor;

      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;

      void main() {
        vec3 baseColor = uColor;

        // Fresnel rim glow: invert dot(n, vDir) so edges are bright.
        float facing = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, 2.0);

        // Horizontal scanlines (scrolling bands).
        float scan = sin(vWorldPos.y * 58.0 + uTime * 2.0);
        float scanPeaks = smoothstep(0.75, 1.0, scan); // peaks only
        float scanAlpha = scanPeaks * 0.15;

        // Flicker: brief opacity drop to 0.4 for ~80ms every few seconds.
        float period = 3.0;
        float within = mod(uTime, period);
        float gateTime = step(within, 0.08); // ~80ms window
        float sineGate = step(0.92, sin(uTime * (6.28318530718 / period))); // thresholded sine
        float flickerFactor = mix(1.0, 0.4, gateTime * sineGate);

        // Transparent hologram base fill + rim glow.
        float baseOpacity = 0.08;
        float alpha = baseOpacity + fresnel * 0.25 + scanAlpha;
        alpha *= flickerFactor;

        // Slightly brighten rim while keeping the brown hologram on-theme.
        vec3 color = baseColor * (0.8 + fresnel * 2.0);

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
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.material = hologramMaterial;
                mesh.material.needsUpdate = true;
                // Avoid shadows on a transparent hologram pass.
                mesh.castShadow = false;
                mesh.receiveShadow = false;
            }
        });
    }, [scene, hologramMaterial]);

    useEffect(() => {
        return () => {
            hologramMaterial.dispose();
        };
    }, [hologramMaterial]);

    useFrame((state, delta) => {
        // Drive shader time.
        hologramMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        hologramMaterial.uniforms.uColor.value.copy(themeColor);

        // Slow auto-rotate around Y.
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.004;
        }
    });

    return (
        // Outer group: positions the star toward the top-right; no tilt so it faces the camera
        <group position={[6, 3, 0]} rotation={[Math.PI / 4, 0, 0]}>
            {/* Inner group: spins around its own center (origin) */}
            <group ref={groupRef} dispose={null}>
                <primitive object={scene} scale={10} />
            </group>
        </group>
    );
}

useGLTF.preload("/star.glb");

export default function HeroModel() {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none w-full h-full overflow-hidden">
            <Canvas
                camera={{ position: [0, 0, 14], fov: 40, near: 0.1, far: 100 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.8,   // raised so dark material reads properly
                }}
            >
                {/* Ambient fill — enough to reveal the red hue in shadow areas */}
                <ambientLight intensity={1.2} color="#ff9980" />

                {/* Key light — bright white from top-right */}
                <directionalLight
                    position={[8, 12, 6]}
                    intensity={4.0}
                    color="#ffffff"
                />

                {/* Fill light — soft blue from the left */}
                <directionalLight
                    position={[-8, 4, 4]}
                    intensity={1.5}
                    color="#c0caff"
                />

                {/* Rim light — warm orange from behind to separate from background */}
                <directionalLight
                    position={[0, -4, -10]}
                    intensity={1.2}
                    color="#ff8844"
                />

                {/* Studio HDRI: gives metallic surface crisp, clean reflections */}
                <Environment preset="studio" environmentIntensity={0.8} />

                <Model />
            </Canvas>
        </div>
    );
}
