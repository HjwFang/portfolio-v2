"use client";

import { useGLTF, Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LoopSubdivision } from "three-subdivide";

function Model() {
    const { scene } = useGLTF("/star.glb");
    const groupRef = useRef<THREE.Group>(null);

    // Apply dark reddish-brown metallic material to every mesh
    useEffect(() => {
        scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                // 1. Merge split vertices (Blender splits verts at sharp edges on export)
                let geo = mergeVertices(mesh.geometry, 1e-4);
                // 2. Subdivide 2x with Loop subdivision to increase poly count
                //    Original mesh has only ~288 verts; 2 iterations → ~4x more geometry
                geo = LoopSubdivision.modify(geo, 2);
                // 3. Recompute smooth normals across the now-dense mesh
                geo.computeVertexNormals();
                mesh.geometry = geo;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.material = new THREE.MeshStandardMaterial({
                    color: "#6b3a36",     // warm dark reddish-brown (slightly lighter to show in metallic)
                    roughness: 0.18,      // glossy but not mirror
                    metalness: 0.95,      // very metallic
                    side: THREE.DoubleSide,
                    envMapIntensity: 1.0,
                });
            }
        });
    }, [scene]);

    // Rotate around Z axis → flat spin in the XY plane
    useFrame((_state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y -= delta * 0.3;
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
