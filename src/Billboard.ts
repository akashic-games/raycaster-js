import { Vector2Like } from "./types";
import { Texture } from "./Texture";

/**
 * ビルボード。
 *
 * Raycaster によって描画される画像を扱うインターフェース。
 */
export interface Billboard {
	/** 位置。 */
	position: Vector2Like;

	/** スケール。 */
	scale: Vector2Like;

	/** 床からの高さ。 */
	vOffset: number;

	/** ビルボードの向きを表す角度(radian)。 0 の時、X軸正の方向を向く。  */
	angle: number;

	/**
	 * テクスチャ配列。
	 *
	 * ビルボードの表示に用いるテクスチャ。
	 *
	 * カメラから見たビルボードの方向に合わせて、表示するテクスチャが選択される。
	 *
	 * 例えば、テクスチャが1枚の時、どの方向から見てもそのそのテクスチャが用いられる。
	 * テクスチャが4枚なら、順に前面、右側面、背面、左側面から見た時に用いられる。
	 */

	textures: Texture[];
}
