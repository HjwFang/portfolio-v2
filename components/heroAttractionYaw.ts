import type { MutableRefObject } from "react";
import * as THREE from "three";

export const ATTRACTION_IDLE_YAW_RAD_PER_SEC = 0.085;
/** Higher = drag delta catches up to pointer faster (still smoothed across frames). */
export const ATTRACTION_DRAG_SMOOTH_RATE = 28;
/** Scales arcball drag angle. */
export const ATTRACTION_DRAG_SENSITIVITY = 1.2;

export type HeroAttractionInteractionState = {
    dragging: boolean;
    /** Previous arcball vector in view space. */
    prevArcX: number;
    prevArcY: number;
    prevArcZ: number;
    hasPrevArc: boolean;
    /** Pending rotation vector (axis * angle). */
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
    const tempAxis = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();

    const smooth = 1 - Math.exp(-ATTRACTION_DRAG_SMOOTH_RATE * delta);
    const ax = interaction.pendingX * smooth;
    const ay = interaction.pendingY * smooth;
    const az = interaction.pendingZ * smooth;
    interaction.pendingX -= ax;
    interaction.pendingY -= ay;
    interaction.pendingZ -= az;

    const dragAngle = Math.hypot(ax, ay, az);
    if (dragAngle > 1e-6) {
        tempAxis.set(ax / dragAngle, ay / dragAngle, az / dragAngle);
        tempQuat.setFromAxisAngle(tempAxis, dragAngle);
        // Apply in parent/world space for screen-space arcball feel.
        group.quaternion.premultiply(tempQuat);
    }

    if (!interaction.dragging) {
        tempQuat.setFromAxisAngle(tempAxis.set(0, 1, 0), delta * ATTRACTION_IDLE_YAW_RAD_PER_SEC);
        group.quaternion.premultiply(tempQuat);
    }
}
