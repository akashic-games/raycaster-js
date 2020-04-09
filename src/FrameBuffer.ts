/**
 * フレームバッファ。
 *
 * Raycaster のレンダリング結果を格納するバッファ。
 */
export interface FrameBuffer {
    /** 横幅 */
    width: number;

    /** 縦幅 */
    height: number;

    /** レンダリング結果を格納する配列。 */
    data: Uint8ClampedArray;
}
