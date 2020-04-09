/**
 * テクスチャ。
 *
 * Tilemap の壁やビルボードをレンダリングするときの画像を表すインターフェース。
 */
export interface Texture {
	/** 横幅 */
	width: number;

	/** 縦幅 */
	height: number;

	/** ピクセルデータ。RGBAの配列。 */
	data: Uint8ClampedArray;
}
