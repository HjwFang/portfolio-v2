import type { MutableRefObject } from "react";
import type * as THREE from "three";

export const ATTRACTION_IDLE_YAW_RAD_PER_SEC = 0.085;
/** Higher = drag delta catches up to pointer faster (still smoothed across frames). */
export const ATTRACTION_DRAG_SMOOTH_RATE = 28;
/** Pointer X → rotation around Y; pointer Y → rotation around X (inverted in handler). */
export const ATTRACTION_DRAG_SENSITIVITY = 0.014;
/**
 * Roll (Z) from curved drags: 2D cross product of consecutive move segments
 * (straight lines stay at zero; circles and arcs build twist).
 */
export const ATTRACTION_DRAG_TWIST_FACTOR = 0.00014;
/** Extra roll when moving diagonally (dx·dy); axis-aligned moves stay pitch/yaw-only. */
export const ATTRACTION_DRAG_DIAGONAL_ROLL_FACTOR = 0.000055;

export type HeroAttractionInteractionState = {
    dragging: boolean;
    lastClientX: number;
    lastClientY: number;
    /** Previous pointer segment (px), for twist / roll. */
    prevSegDx: number;
    prevSegDy: number;
    pendingX: number;
    pendingY: number;
    pendingZ: number;
};

export type HeroAttractionInteractionRef = MutableRefObject<HeroAttractionInteractionState>;

export function applyAttractionRotation(
    group: THREE.Object3D,
    interaction: HeroAttractionInteractionState,
    delta: number,
) {
    const smooth = 1 - Math.exp(-ATTRACTION_DRAG_SMOOTH_RATE * delta);
    const ax = interaction.pendingX * smooth;
    const ay = interaction.pendingY * smooth;
    const az = interaction.pendingZ * smooth;
    interaction.pendingX -= ax;
    interaction.pendingY -= ay;
    interaction.pendingZ -= az;
    group.rotation.x += ax;
    group.rotation.y += ay;
    group.rotation.z += az;
    if (!interaction.dragging) {
        group.rotation.y += delta * ATTRACTION_IDLE_YAW_RAD_PER_SEC;
    }
}
