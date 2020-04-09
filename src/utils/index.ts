import { Vec3, Vec2 } from "../math";
import { Camera } from "../Camera";
import { Tilemap } from "../Tilemap";
import { Billboard } from "../Billboard";
import { Vector2Like, Vector3Like } from "../types";

/**
 * レイ。
 *
 * 始点と方向で表される半直線。
 */
export interface Ray {
	/** 始点。 */
	startPosition: Vector3Like;

	/** 方向と長さ。 */
	direction: Vector3Like;
}

/**
 * レイ (2D)。
 *
 * XY平面上のレイ。
 * 始点と方向で表される半直線。
 */
export interface Ray2D {
	/** 始点。 */
	startPosition: Vector2Like;

	/** 方向と長さ。 */
	direction: Vector2Like;
}

/**
 * レイとタイルマップの交差テスト結果。
 */
export interface RayTilemapIntersectionResult {
	/** 交差のあったセルの位置。 */
	mapPosition: Vector2Like;

	/** 交差した面。 0 の時、東西いずれかの面。 1 の時、南北いずれかの面。 */
	side: number;

	/** 交差位置。 */
	hitPosition: Vector2Like;

	/** 交差位置の面法線ベクトル。 */
	normal: Vector2Like;

	/** レイの位置から交差位置までの距離。 */
	perpendicularDistance: number;
}

/**
 * レイとタイルマップの交差テスト。
 *
 * この関数に与えるレイとタイルマップは以下の制約がある。
 *
 * 1. レイと交差するタイルが存在する。
 * 2. レイの方向ベクトルをXY平面に投影したベクトルが単位ベクトルの時のみ、
 *    得られるperpendicularDistance が正しい値になる。
 *
 * @param ray 交差判定に用いるレイ。zの値は使用されない。
 * @param tilemap レイと交差テストするタイルマップ。
 */
export function rayTilemapIntersection(ray: Ray | Ray2D, tilemap: Tilemap): RayTilemapIntersectionResult {
	const mapWidth = tilemap.width;
	const map = tilemap.map;

	let map_pos_x = Math.floor(ray.startPosition.x);
	let map_pos_y = Math.floor(ray.startPosition.y);

	const ray_dir_x = ray.direction.x;
	const ray_dir_y = ray.direction.y;
	const step_x = ray_dir_x >= 0 ? 1 : -1;
	const step_y = ray_dir_y >= 0 ? 1 : -1;

	const delta_dist_x = Math.abs(1.0 / ray_dir_x);
	const delta_dist_y = Math.abs(1.0 / ray_dir_y);

	let side_dist_x = (
		ray_dir_x >= 0.0
			? map_pos_x + 1.0 - ray.startPosition.x
			: ray.startPosition.x - map_pos_x
	) * delta_dist_x;
	let side_dist_y = (
		ray_dir_y >= 0.0
			? map_pos_y + 1.0 - ray.startPosition.y
			: ray.startPosition.y - map_pos_y
	) * delta_dist_y;

	let side = 0; // 0 は東西の側面、1 は南北の側面を表す。
	while (true) {
		if (side_dist_x < side_dist_y) {
			side_dist_x += delta_dist_x;
			map_pos_x += step_x;
			side = 0;
		} else {
			side_dist_y += delta_dist_y;
			map_pos_y += step_y;
			side = 1;
		}
		if (map[map_pos_y * mapWidth + map_pos_x] !== 0) {
			break;
		}
	}

	const perpendicular_distance = side === 0
		? (map_pos_x - ray.startPosition.x + (1 - step_x) / 2) / ray_dir_x
		: (map_pos_y - ray.startPosition.y + (1 - step_y) / 2) / ray_dir_y;

	return {
		mapPosition: { x: map_pos_x, y: map_pos_y },
		hitPosition: {
			x: ray.startPosition.x + perpendicular_distance * ray_dir_x,
			y: ray.startPosition.y + perpendicular_distance * ray_dir_y,
		},
		side: side,
		normal: {
			x: side === 0 ? step_x * -1 : 0,
			y: side === 1 ? step_y * -1 : 0
		},
		perpendicularDistance: perpendicular_distance,
	};
}

/**
 * カメラ座標を始点とし、スクリーン上の一点を指す結ぶレイを生成する。
 *
 * スクリーン座標は正規化されていなければならない。たとえばスクリーン解像度 640x480 に
 * おいて座標 16, 32 は正規化座標では 16/640, 32/480 となる。
 *
 * @param normalizedScreenPosition 正規化スクリーン座標。
 * @param camera カメラ。
 */
export function screenPointToRay(normalizedScreenPosition: Vector2Like, camera: Camera): Ray {
	const t = -1 + normalizedScreenPosition.x * 2;
	return {
		startPosition: {
			x: camera.position.x,
			y: camera.position.y,
			z: 0.5
		},
		direction: {
			x: camera.direction.x + camera.plane.x * t,
			y: camera.direction.y + camera.plane.y * t,
			z: (1 - normalizedScreenPosition.y) - 0.5
		}
	};
}

/**
 * レイとタイルマップ・天井・床の交差判定結果。
 */
export interface RayTilemapCeilingFloorIntersectionResult {
	/** 交差した位置。 */
	position: Vector3Like;

	/**レイの始点から交差点までの距離をレイの方向ベクトルの長さで割った量。 */
	rayScale: number;

	/** 交差した対象の法線。 */
	normal: Vector3Like;
}

/**
 * レイとタイルマップ・天井・床の交差判定。
 *
 * @param ray レイ。
 * @param tilemap タイルマップ。
 */
export function rayTilemapCeilingFloorIntersection(ray: Ray, tilemap: Tilemap): RayTilemapCeilingFloorIntersectionResult {
	const ray2dDirection = new Vec2(ray.direction);
	const ray2dLength = ray2dDirection.length();

	ray2dDirection.scale(1 / ray2dLength); // XY平明上で正規化。

	const ray2d: Ray2D = {
		startPosition: {
			x: ray.startPosition.x,
			y: ray.startPosition.y
		},
		direction: ray2dDirection
	};

	const {
		hitPosition,
		normal,
		perpendicularDistance
	} = rayTilemapIntersection(ray2d, tilemap);

	const hitZ = ray.startPosition.z + ray.direction.z / ray2dLength * perpendicularDistance;

	let n: Vec3;
	let d: number;

	if (hitZ <= 0) {
		n = new Vec3(0, 0, 1);
		d = 0;
	} else if (hitZ >= 1) {
		n = new Vec3(0, 0, -1);
		d = 1;
	} else {
		n = new Vec3(normal.x, normal.y, 0);
		d = -Vec2.dot(normal, hitPosition);
	}
	const t = -(d + n.dot(ray.startPosition)) / n.dot(ray.direction);

	return {
		position: {
			x: ray.startPosition.x + ray.direction.x * t,
			y: ray.startPosition.y + ray.direction.y * t,
			z: ray.startPosition.z + ray.direction.z * t
		},
		rayScale: t,
		normal: n
	};
}

/**
 * レイとビルボードの交差判定結果。
 */
export interface RayBillboardIntersectionResult {
	/** レイとビルボード平面との交差点の座標。 */
	position: Vector3Like;

	/**
	 * レイの先端を交差点に一致させるスケール。
	 *
	 * レイとビルボードの交差点 = レイの始点 + レイの方向ベクトル x rayScale
	 *
	 * という関係になる。
	 */
	rayScale: number;

	/**
	 * ビルボード上の交差点座標。
	 *
	 * レイとビルボードの交差点をビルボード座標系で表した座標。
	 *
	 * ビルボード座標系は、ビルボードの中心を原点とし、ビルボードの縦横の大きさを
	 * 1 とする。
	 *
	 * つまり -0.5 <= uv.x <= 0.5 かつ -0.5 <= uv.y <= 0.5 の時、
	 * 交差点はビルボード内部にある。
	 */
	uv: Vector2Like;
}

/**
 * レイとビルボードの交差判定。
 *
 * @param ray レイ。
 * @param billboard ビルボード。
 * @param billboardDirection　ビルボードの向きを表す単位ベクトル。
 */
export function rayBillboardIntersection(ray: Ray, billboard: Billboard, billboardDirection: Vector2Like): RayBillboardIntersectionResult {
	const rs = new Vec3(ray.startPosition);
	const dir = new Vec3(ray.direction);
	const billboardPos = new Vec3(billboard.position.x, billboard.position.y, 0);
	const normal = new Vec3(billboardDirection.x, billboardDirection.y, 0);
	const d = -normal.dot(billboardPos);
	const t = -(d + rs.dot(normal)) / dir.dot(normal);
	const tangent = new Vec3(normal.y, -normal.x, 0);
	const origin = new Vec3(billboard.position.x, billboard.position.y, 0.5 + billboard.vOffset);
	const worldHitPos = rs.add(dir.scale(t));
	const hitPos = worldHitPos.clone().sub(origin);
	const u = hitPos.dot(tangent) / billboard.scale.x;
	const v = hitPos.z / billboard.scale.y;

	return {
		position: worldHitPos,
		rayScale: t,
		uv: { x: u, y: v }
	};
}
