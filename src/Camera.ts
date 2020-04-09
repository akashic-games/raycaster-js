import { Vec2 } from "./math";

/**
 * カメラクラス。
 *
 * Camera はレイキャスティングによって3D空間をレンダリングするときの視点を扱います。
 */
export class Camera {
	/**
	 * 位置。
	 */
	position: Vec2;

	/** 向きを表す角度(radian)。
	 *
	 * 0 の時、カメラは (0, -1)　の方向を向く。
	 *
	 * 参照のみ。
	 */
	get angle() {
		return this._angle;
	}

	/**
	 * カメラの向いている方向を表す単位ベクトル。
	 *
	 * 参照のみ。
	 */

	get direction() {
		return this._dir;
	}

	/**
	 * カメラの向いている方向と垂直なベクトル。
	 *
	 * 参照のみ。
	 */
	get plane() {
		return this._plane;
	}

	/**
	 * 画角。
	 */
	get aspectRatio() {
		return this._aspectRatio;
	}
	set aspectRatio(newAspectRatio: number) {
		this._aspectRatio = newAspectRatio;
		this._plane = (new Vec2(this._aspectRatio / 2, 0)).rotate(this.angle);
	}

	private _angle: number;
	private _dir: Vec2;
	private _plane: Vec2;
	private _aspectRatio: number;

	/**
	 * コンストラクタ。
	 *
	 * @param x: カメラのX座標。
	 * @param y: カメラのY座標。
	 * @param angle 向きを表す角度。0 の時、カメラは (0, -1)　の方向を向く。
	 * @param aspectRatio 画角。通常、スクリーンの縦横比。
	 */
	constructor(x: number, y: number, angle: number, aspectRatio: number) {
		this.position = new Vec2(x, y);
		this._angle = angle;
		this._aspectRatio = aspectRatio;
		this.rotateTo(angle);
	}

	/**
	 * カメラをカメラから見た前後左右に移動する。
	 *
	 * @param offset 移動量。
	 */
	moveLocal(dx: number ,dy: number): void {
		const xOffset = (new Vec2(-dx, 0)).rotate(this.angle);
		const yOffset = { x: this._dir.x * dy, y: this._dir.y * dy };
		this.position.x += xOffset.x + yOffset.x;
		this.position.y += xOffset.y + yOffset.y;
	}

	/**
	 * カメラを回転する。
	 *
	 * @param angle 回転角(radian)。　
	 */
	rotate(angle: number): void {
		this._dir.rotate(angle);
		this._plane.rotate(angle);
		this._angle += angle;
	}

	/**
	 * カメラの向きを設定する。
	 *
	 * 0 の時、カメラは (0, -1)　の方向を向く。
	 *
	 * @param angle 向きを表す角度(radian)。
	 */
	rotateTo(angle: number): void {
		this._dir = (new Vec2(0, -1)).rotate(angle);
		this._plane = (new Vec2(this.aspectRatio / 2, 0)).rotate(angle);
	}
}
