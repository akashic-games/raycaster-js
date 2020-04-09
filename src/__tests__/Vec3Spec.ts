import { Vec3 } from "../math/Vec3";

describe("Vec3", () => {

    it("constructs with x, y and z value", () => {
        const v = new Vec3(1, 2, 3);
        expect(v.x).toEqual(1);
        expect(v.y).toEqual(2);
        expect(v.z).toEqual(3);
    });

    it("constructs with Vector3Like", () => {
        const v = new Vec3({ x: 1, y: 2, z: 3 });
        expect(v.x).toEqual(1);
        expect(v.y).toEqual(2);
        expect(v.z).toEqual(3);
    });

    it("constructs zero vector without arguments", () => {
        const v = new Vec3();
        expect(v.x).toEqual(0);
        expect(v.y).toEqual(0);
        expect(v.z).toEqual(0);
    });

    it("clones", () => {
        const v = new Vec3(1, 2, 3);
        const w = v.clone();
        expect(v.x).toEqual(w.x);
        expect(v.y).toEqual(w.y);
        expect(v.z).toEqual(w.z);
    });


    it("adds", () => {
        const v = new Vec3(1, 2, 3);
        v.add({ x: 1, y: 2, z: 3 });
        expect(v.x).toEqual(2);
        expect(v.y).toEqual(4);
        expect(v.z).toEqual(6);
    });

    it("subs", () => {
        const v = new Vec3(2, 4, 6);
        v.sub({ x: 1, y: 2, z: 3 });
        expect(v.x).toEqual(1);
        expect(v.y).toEqual(2);
        expect(v.z).toEqual(3);
    });

    it("scales", () => {
        const v = new Vec3(1, 2, 3);
        v.scale(2);
        expect(v.x).toEqual(2);
        expect(v.y).toEqual(4);
        expect(v.z).toEqual(6);
    });

    it("dots", () => {
        const v = new Vec3(1, 2, 3);
        expect(v.dot({ x: 2, y: 4, z: 6 })).toEqual(28);
    });

    it("crosses", () => {
        const v = new Vec3(1, 0, 0).cross({ x: 0, y: 1, z: 0 });
        expect(v.x).toEqual(0);
        expect(v.y).toEqual(0);
        expect(v.z).toEqual(1);
    });

    it("calculates squared length", () => {
        const v = new Vec3(1, 2, 3);
        expect(v.squaredLength()).toEqual(14);
    });

    it("calculates length", () => {
        const v = new Vec3(3, 4, 5);
        expect(v.length()).toEqual(Math.sqrt(50));
    });

    it("normalizes", () => {
        const v = new Vec3(3, 4, 5);
        v.normalize();
        expect(v.x).toEqual(3 / Math.sqrt(50));
        expect(v.y).toEqual(4 / Math.sqrt(50));
        expect(v.z).toEqual(5 / Math.sqrt(50));
    });

    it("rotates around X", () => {
        const v = new Vec3(1, 2, 3);
        v.rotateX(Math.PI / 2);
        expect(v.x).toEqual(1);
        expect(v.y).toBeCloseTo(-3, 5);
        expect(v.z).toBeCloseTo(2, 5);
    });

    it("rotates around Y", () => {
        const v = new Vec3(1, 2, 3);
        v.rotateY(Math.PI / 2);
        expect(v.x).toBeCloseTo(3, 5);
        expect(v.y).toEqual(2);
        expect(v.z).toBeCloseTo(-1, 5);
    });

    it("rotates around Z", () => {
        const v = new Vec3(1, 2, 3);
        v.rotateZ(Math.PI / 2);
        expect(v.x).toBeCloseTo(-2, 5);
        expect(v.y).toBeCloseTo(1, 5);
        expect(v.z).toEqual(3);
    });

    it("dots 2 Vector3Likes", () => {
        expect(Vec3.dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual(0);
    });

    it("crosses 2 Vector3Likes", () => {
        const v = Vec3.cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
        expect(v.x).toEqual(0);
        expect(v.y).toEqual(0);
        expect(v.z).toEqual(1);
    });

});
