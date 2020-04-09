import { Vector3Like } from "../types";

export class Vec3 {
    x: number;
    y: number;
    z: number;

    constructor(xOrVector3Like?: number | Vector3Like, y: number = 0, z: number = 0) {
        if (typeof xOrVector3Like === "number") {
            this.x = xOrVector3Like;
            this.y = y;
            this.z = z;
        } else {
            const v = xOrVector3Like || Vec3.zero;
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
        }
    }

    static readonly zero = { x: 0, y: 0, z: 0 };

    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z);
    }

    add(other: Vector3Like): Vec3 {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    sub(other: Vector3Like): Vec3 {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    scale(value: number): Vec3 {
        this.x *= value;
        this.y *= value;
        this.z *= value;
        return this;
    }

    dot(other: Vector3Like): number {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    cross(other: Vector3Like): Vec3 {
        return new Vec3(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }

    squaredLength(): number {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    length(): number {
        return Math.sqrt(this.squaredLength());
    }

    normalize(): Vec3 {
        const len = this.length() || 1;
        this.x /= len;
        this.y /= len;
        this.z /= len;
        return this;
    }

    rotateX(angle: number): Vec3 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = this.x;
        const y = c * this.y - s * this.z;
        const z = s * this.y + c * this.z;

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    rotateY(angle: number): Vec3 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = s * this.z + c * this.x;
        const y = this.y;
        const z = c * this.z - s * this.x;

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    rotateZ(angle: number): Vec3 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = c * this.x - s * this.y;
        const y = s * this.x + c * this.y;
        const z = this.z;

        this.x = x;
        this.y = y;
        this.z = z;

        return this;
    }

    static dot(v1: Vector3Like, v2: Vector3Like): number {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    static cross(v1: Vector3Like, v2: Vector3Like): Vector3Like {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };
    }
}
