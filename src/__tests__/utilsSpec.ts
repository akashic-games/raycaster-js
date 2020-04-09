import {
    Ray2D,
    rayTilemapIntersection,
    screenPointToRay,
    rayTilemapCeilingFloorIntersection,
    rayBillboardIntersection
} from "../utils";
import { Tilemap } from "../Tilemap";
import { Camera } from "../Camera";
import { Vec3 } from "../math";
import { Billboard } from "../Billboard";

describe("rayTilemapIntersection", () => {
    const tilemap: Tilemap = {
        width: 6,
        height: 6,
        map: [
            1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1
        ]
    };

    it("tests ray intersection against tilemap case 1", () => {
        // normalized direction.
        const ray: Ray2D = {
            startPosition: { x: 2.5, y: 2.5 },
            direction: { x: 1, y: 0 }
        }
        const result = rayTilemapIntersection(ray, tilemap);

        expect(result.hitPosition.x).toBeCloseTo(5, 5);
        expect(result.hitPosition.y).toBeCloseTo(2.5, 5);
        expect(result.mapPosition.x).toEqual(5);
        expect(result.mapPosition.y).toEqual(2);
        expect(result.normal.x).toBe(-1);
        expect(result.normal.y).toBe(0);
        expect(result.perpendicularDistance).toBeCloseTo(2.5, 5);
        expect(result.side).toBe(0);
    });

    it("tests ray intersection against tilemap case 2", () => {
        // non-normalized direction.
        const ray: Ray2D = {
            startPosition: { x: 2, y: 2 },
            direction: { x: 1, y: 0.5 }
        }
        const result = rayTilemapIntersection(ray, tilemap);

        expect(result.hitPosition.x).toBeCloseTo(5, 5);
        expect(result.hitPosition.y).toBeCloseTo(3.5, 5);
        expect(result.mapPosition.x).toEqual(5);
        expect(result.mapPosition.y).toEqual(3);
        expect(result.normal.x).toBe(-1);
        expect(result.normal.y).toBe(0);
        expect(result.perpendicularDistance).toBeCloseTo(3, 5);
        expect(result.side).toBe(0);
    });
});

describe("screenPointToRay", () => {
    it("creates a ray statring from camera", () => {
        const nx = 0.75;
        const ny = 0.25;
        const camera = new Camera(2, 3, 0, 16 / 9);
        const ray = screenPointToRay({ x: nx, y: ny }, camera);
        const t = nx * 2 - 1;

        expect(ray.startPosition.x).toEqual(camera.position.x);
        expect(ray.startPosition.y).toEqual(camera.position.y);
        expect(ray.startPosition.z).toEqual(0.5);
        expect(ray.direction.x).toEqual(camera.direction.x + camera.plane.x * t);
        expect(ray.direction.y).toEqual(camera.direction.y + camera.plane.y * t);
        expect(ray.direction.z).toEqual((1 - ny) - 0.5);
    });
});

describe("rayTilemapCeilingFloorIntersection", () => {
    const tilemap: Tilemap = {
        width: 6,
        height: 6,
        map: [
            1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 1,
            1, 0, 0, 1, 0, 1,
            1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1
        ]
    };

    it("tests ray intersection against wall", () => {
        const startPosition = new Vec3(1.5, 4.5, 0.5);
        const direction = new Vec3(2, -1.5, 0);
        const ray = { startPosition, direction };
        const result = rayTilemapCeilingFloorIntersection(ray, tilemap);

        expect(result.normal.x).toEqual(0);
        expect(result.normal.y).toEqual(1);
        expect(result.normal.z).toEqual(0);
        expect(result.position.x).toEqual(3.5);
        expect(result.position.y).toEqual(3);
        expect(result.position.z).toEqual(0.5);
        expect(result.rayScale).toEqual(1);
    });

    it("tests ray intersection against ceiling", () => {
        const startPosition = new Vec3(1.5, 4.5, 0.5);
        const direction = new Vec3(2, -1.5, 1);
        const ray = { startPosition, direction };
        const result = rayTilemapCeilingFloorIntersection(ray, tilemap);

        expect(result.normal.x).toEqual(0);
        expect(result.normal.y).toEqual(0);
        expect(result.normal.z).toEqual(-1);
        expect(result.position.x).toEqual(2.5);
        expect(result.position.y).toEqual(3.75);
        expect(result.position.z).toEqual(1);
        expect(result.rayScale).toEqual(0.5);
    });
});

describe("rayBillboardIntersection", () => {
    it("tests ray intersection against billboard case 1", () => {
        // Aim at the center of the billboard.
        const ray = {
            startPosition: new Vec3(1, 1, 0.5),
            direction: new Vec3(1, 1, 0)
        };
        const billboard: Billboard = {
            position: { x: 3, y: 3 },
            scale: { x: 1, y: 1 },
            vOffset: 0,
            angle: 0,
            textures: null
        };
        const direction = new Vec3(0, -1, 0);
        const result = rayBillboardIntersection(ray, billboard, direction);

        expect(result.position.x).toEqual(3);
        expect(result.position.y).toEqual(3);
        expect(result.position.z).toEqual(0.5);
        expect(result.rayScale).toEqual(2);
        expect(result.uv.x).toEqual(0);
        expect(result.uv.y).toEqual(0);
    });

    it("tests ray intersection against billboard case 2", () => {
        // Aim at the right center of the billboard.
        const ray = {
            startPosition: new Vec3(1, 1, 0.5),
            direction: new Vec3(1, 1, 0)
        };
        const billboard: Billboard = {
            position: { x: 3.5, y: 2.5 },
            scale: { x: Math.sqrt(2), y: 1 },
            vOffset: 0,
            angle: 0,
            textures: null
        };
        const direction = new Vec3(-1, -1, 0).normalize();
        const result = rayBillboardIntersection(ray, billboard, direction);

        expect(result.position.x).toEqual(3);
        expect(result.position.y).toEqual(3);
        expect(result.position.z).toEqual(0.5);
        expect(result.rayScale).toEqual(2);
        expect(result.uv.x).toBeCloseTo(0.5, 5);
        expect(result.uv.y).toEqual(0);
    });

    it("tests ray intersection against billboard case 3", () => {
        // Aim at the left center of the billboard.
        const ray = {
            startPosition: new Vec3(1, 1, 0.5),
            direction: new Vec3(3, 1, 0).scale(2)
        };
        const billboard: Billboard = {
            position: { x: 3.5, y: 2.5 },
            scale: { x: Math.sqrt(2), y: 1 },
            vOffset: 0,
            angle: 0,
            textures: null
        };
        const direction = new Vec3(-1, -1, 0).normalize();
        const result = rayBillboardIntersection(ray, billboard, direction);

        expect(result.position.x).toEqual(4);
        expect(result.position.y).toEqual(2);
        expect(result.position.z).toEqual(0.5);
        expect(result.rayScale).toEqual(0.5);
        expect(result.uv.x).toBeCloseTo(-0.5, 5);
        expect(result.uv.y).toEqual(0);
    });

    it("tests ray intersection against billboard case 4", () => {
        // Aim at the top-right corner of the billboard.
        const ray = {
            startPosition: new Vec3(1, 1, 0.5),
            direction: new Vec3(1, 1, 0.25)
        };
        const billboard: Billboard = {
            position: { x: 3.5, y: 2.5 },
            scale: { x: Math.sqrt(2), y: 1 },
            vOffset: 0,
            angle: 0,
            textures: null
        };
        const direction = new Vec3(-1, -1, 0).normalize();
        const result = rayBillboardIntersection(ray, billboard, direction);

        expect(result.position.x).toEqual(3);
        expect(result.position.y).toEqual(3);
        expect(result.position.z).toEqual(1);
        expect(result.rayScale).toEqual(2);
        expect(result.uv.x).toBeCloseTo(0.5, 5);
        expect(result.uv.y).toEqual(0.5);
    });
});
