import { RGBLike } from "./types";

/** フォグ */
export interface Fog {
    /** フォグ開始距離。 */
    near: number;

    /** フォグ終了距離。 */
    far: number;

    /** 色。 */
	color: RGBLike;
}
