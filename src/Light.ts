import { Vector3Like, RGBLike } from "./types";

/** ライト。 */
export interface Light {
    /** ライトの方向。 */
    direction: Vector3Like;

    /** ライトの色。 */
    color: RGBLike;

    /** 環境光の色。 */
	ambientColor: RGBLike;
}
