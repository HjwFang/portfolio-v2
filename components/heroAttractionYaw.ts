import type { MutableRefObject } from "react";
import type * as THREE from "three";

export const ATTRACTION_IDLE_YAW_RAD_PER_SEC = 0.035;
/** Higher = drag delta catches up to pointer faster (still smoothed across frames). */
export const ATTRACTION_DRAG_SMOOTH_RATE = 28;
export const ATTRACTION_DRAG_SENSITIVITY = 0.014;

export type HeroAttractionInteractionState = {
    dragging: boolean;
    lastClientX: number;
    pendingYawDelta: number;
};

export type HeroAttractionInteractionRef = MutableRefObject<HeroAttractionInteractionState>;

export function applyAttractionYaw(
    group: THREE.Object3D,
    interaction: HeroAttractionInteractionState,
    delta: number,
) {
    const smooth = 1 - Math.exp(-ATTRACTION_DRAG_SMOOTH_RATE * delta);
    const applied = interaction.pendingYawDelta * smooth;
    interaction.pendingYawDelta -= applied;
    group.rotation.y += applied;
    if (!interaction.dragging) {
        group.rotation.y += delta * ATTRACTION_IDLE_YAW_RAD_PER_SEC;
    }
}
