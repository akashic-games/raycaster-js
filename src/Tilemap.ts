/**
 * タイルマップ。
 */
export interface Tilemap {
	/** 横幅。 */
	width: number;

	/** 縦幅。 */
	height: number;

	/** タイルの配列。 Raycaster は map に格納されている値 - 1 をテクスチャ配列のインデックスとして用いる。 */
	map: number[];
}
