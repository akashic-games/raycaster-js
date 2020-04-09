import { FrameBuffer } from "./FrameBuffer";
import { Camera } from "./Camera";
import { Texture } from "./Texture";
import { Billboard } from "./Billboard";
import { Tilemap } from "./Tilemap";
import { Light } from "./Light";
import { Fog } from "./Fog";
import { rayTilemapIntersection } from "./utils";
import { RGBLike } from "./types";

function selectTextureByCamera(billboard: Billboard, camera: Camera): Texture {
	const TAU = Math.PI * 2;
	const angleRange = TAU / billboard.textures.length;
	const dx = camera.position.x - billboard.position.x;
	const dy = camera.position.y - billboard.position.y;
	let angle = (Math.atan2(dy, dx) - (billboard.angle - angleRange / 2)) % TAU; // (-TAU, TAU)
	angle = (angle + TAU) % TAU; // [0, TAU)
	const index = Math.floor(angle / angleRange);
	return billboard.textures[index];
}

/**
 * バッファタイプ 。
 */
export type BufferType = "color" | "depth";

/**
 * レイキャスタレンダーパラメータ。
 */
export interface RaycasterRenderParam {
	/** タイルマップ。 省略時、描画されない。 */
	tilemap?: Tilemap;

	/** タイルマップのレンダリングに用いるテクスチャ。 省略時、タイルマップは描画されない。 */
	textures?: Texture[];

	/** ビルボード。 */
	billboards?: Billboard[];

	/** 床のテクスチャ。省略時、床は描画されない。 */
	floorTexture?: Texture;

	/** 天井のテクスチャ。省略時、天井は描画されない。 */
	ceilingTexture?: Texture;

	/** ライト。省略時、一様に照らされているようになる。 */
	light?: Light;

	/** フォグ。省略時、フォグは適用されない。 */
	fog?: Fog;

	/** レンダリングの始点となるカメラ。 */
	camera: Camera;
}

/**
 * レイキャスター。
 */
export class Raycaster {
	private width: number;
	private height: number;
	private rgba: Uint8ClampedArray;
	private zBuffer: number[];

	/**
	 * コンストラクタ。
	 *
	 * @param frameBuffer　レンダリング結果を格納するイメージデータ。通常、 g.Renderer#_getImageData() の返り値を用いる。
	 */
	constructor(frameBuffer: FrameBuffer) {
		this.width = frameBuffer.width;
		this.height = frameBuffer.height;
		this.rgba = frameBuffer.data;
		this.zBuffer = new Array<number>(this.width);
	}

	/**
	 * レンダリングする。
	 *
	 * @param param レンダリングする対象やカメラを格納したオブジェクト。
	 */
	render(param: RaycasterRenderParam): void {
		this.clear();

		if (param.floorTexture || param.ceilingTexture) {
			this.renderFloorAndCeiling(param.floorTexture, param.ceilingTexture, param.light, param.fog, param.camera);
		}

		if (param.tilemap && param.textures) {
			this.renderWall(param.tilemap, param.textures, param.light, param.fog, param.camera);
		}

		if (param.billboards) {
			this.renderBillboard(param.billboards, param.light, param.fog, param.camera);
		}
	}

	/**
	 * レンダリングのためのバッファをクリアする。
	 *
	 * @param targets クリアするバッファ。１つも指定しない時、全てのバッファをクリアする。
	 */
	clear(...targets: BufferType[]): void {
		targets = targets.length > 0 ? targets : ["color", "depth"];

		for (let t = 0; t < targets.length; t++) {
			if (targets[t] === "color") {
				// TypedArray.prototype.fill() を利用できないブラウザがあるので、ループにする。
				// 一度Uint32Arrayにすることでループでも fill() に近い性能になる。
				const rgba = new Uint32Array(this.rgba.buffer);
				for (let i = 0; i < rgba.length; i++) {
					rgba[i] = 0x00;
				}
			} else if (targets[t] === "depth") {
				for (let i = 0; i < this.width; i++) {
					this.zBuffer[i++] = Number.MAX_VALUE;
				}
			}
		}
	}

	/**
	 * 壁をレンダリングする。
	 *
	 * @param tilemap タイルマップ。
	 * @param textures タイルのテクスチャの配列。
	 * @param camera カメラ。
	 */
	renderWall(tilemap: Tilemap, textures: Texture[], light: Light, fog: Fog, camera: Camera): void {
		const mapWidth = tilemap.width;
		const map = tilemap.map;

		for (let x = 0; x < this.width; x++) {
			const camera_x = (x / this.width) * 2 - 1;
			const ray_dir_x = camera.direction.x + camera.plane.x * camera_x;
			const ray_dir_y = camera.direction.y + camera.plane.y * camera_x;

			const {
				mapPosition,
				side,
				normal,
				hitPosition,
				perpendicularDistance
			} = rayTilemapIntersection(
				{
					startPosition: camera.position,
					direction: {
						x: ray_dir_x,
						y: ray_dir_y
					}
				},
				tilemap
			);

			const h = Math.floor(this.height / perpendicularDistance);
			const start = Math.floor((this.height - h) / 2.0);
			const end = Math.floor((this.height + h) / 2.0);

			const wallPos = side === 0 ? hitPosition.y : hitPosition.x;
			const u = wallPos - (wallPos | 0); // [0, 1)

			const tex_id = map[mapPosition.y * mapWidth + mapPosition.x] - 1;
			const texture = textures[tex_id];

			let U = (u * texture.width) | 0;
			if ((side === 0 && ray_dir_x < 0) || (side === 1 && ray_dir_y > 0)) {
				U = texture.width - U - 1;
			}

			let lightColor: RGBLike = null;
			if (light) {
				const intensity = Math.max(0, light.direction.x * normal.x + light.direction.y * normal.y);
				// Uint8ClampedArray に書き込むので、255を超えることを考慮しない。
				lightColor = {
					r: light.color.r * intensity + light.ambientColor.r,
					g: light.color.g * intensity + light.ambientColor.g,
					b: light.color.b * intensity + light.ambientColor.b
				};
			}

			this.draw_wall_vline(texture, x, U, start, end, lightColor, fog, perpendicularDistance);

			this.zBuffer[x] = perpendicularDistance;
		}
	}

	/**
	 * ビルボードをレンダリングする。
	 *
	 * @param billboards ビルボードの配列。
	 * @param camera カメラ。
	 */
	renderBillboard(billboards: Billboard[], light: Light, fog: Fog, camera: Camera): void {
		billboards = billboards.map(billboard => {
			const dx = billboard.position.x - camera.position.x;
			const dy = billboard.position.y - camera.position.y;
			return {
				distance: dx * dx + dy * dy,
				billboard: billboard
			};
		}).sort((a, b) => b.distance - a.distance).map(b => b.billboard);

		const invDet = 1 / (camera.plane.x * camera.direction.y - camera.direction.x * camera.plane.y);
		for (let i = 0; i < billboards.length; i++) {
			const billboard = billboards[i];
			const Xcb = billboard.position.x - camera.position.x;
			const Ycb = billboard.position.y - camera.position.y;
			const BXc = invDet * (camera.direction.y * Xcb - camera.direction.x * Ycb);
			const BYc = invDet * (-camera.plane.y * Xcb + camera.plane.x * Ycb);

			// camera space clipping.
			if (BYc <= 0) {
				continue;
			}

			// 整数化には Math.floor() を用いる。
			// BYc が微小な時、 BYc で徐算した値（つまり非常に大きな値）を `|0` で整数化すると異常な値になる。
			// 32bit 整数で表現できない値を整数化したことによるものと考える。
			// また、Math.floor() は十分高速である。
			// see: https://jsperf.com/math-round-vs

			const texture = selectTextureByCamera(billboard, camera);
			const drawOffsetY = Math.floor(-billboard.vOffset / BYc * this.height);
			const BXs = Math.floor(this.width / 2 * (1 + BXc / BYc));
			const billboardHeight = Math.abs(Math.floor(this.height / BYc)) * billboard.scale.y;
			const drawStartY = Math.max(Math.floor((this.height - billboardHeight) / 2 + drawOffsetY), 0);
			const drawEndY = Math.min(Math.floor((this.height + billboardHeight) / 2 + drawOffsetY), this.height);
			const billboardWidth = Math.abs(Math.floor(this.height / BYc)) * billboard.scale.x;
			const drawStartX = Math.max(Math.floor(BXs - billboardWidth / 2), 0);
			const drawEndX = Math.min(Math.floor(BXs + billboardWidth / 2), this.width);

			let lightColor: RGBLike = null;
			if (light) {
				const dx = camera.position.x - billboard.position.x;
				const dy = camera.position.y - billboard.position.y;
				const len = Math.sqrt(dx * dx + dy * dy);
				const nx = dx / len;
				const ny = dy / len;
				const intensity = Math.max(0, light.direction.x * nx + light.direction.y * ny);
				// Uint8ClampedArray に書き込むので、255を超えることを考慮しない。
				lightColor = {
					r: light.color.r * intensity + light.ambientColor.r,
					g: light.color.g * intensity + light.ambientColor.g,
					b: light.color.b * intensity + light.ambientColor.b
				};
			}


			for (let x = drawStartX; x < drawEndX; x++) {
				if (BYc < this.zBuffer[x]) {
					this.draw_billboard_vline(
						texture,
						x, drawStartY, drawEndY, billboardWidth, billboardHeight,
						BXs, drawOffsetY,
						lightColor, fog, BYc
					);
				}
			}
		}
	}

	/**
	 * 床と天井をレンダリングする。
	 *
	 * @param floorTexture 床のテクスチャ。 null の時、描画しない。
	 * @param ceilingTexture 天井のテクスチャ。 nullの時、描画しない。
	 * @param camera カメラ。
	 */
	renderFloorAndCeiling(floorTexture: Texture, ceilingTexture: Texture, light: Light, fog: Fog, camera: Camera): void {
		const width = this.width;
		const posZ = this.height / 2;

		if (!light && !fog) {
			for (let y = 0; y < this.height / 2; y++) {
				const rayDir0 = camera.direction.clone().sub(camera.plane);
				const rayDir1 = camera.direction.clone().add(camera.plane);
				const p = Math.abs(y - this.height / 2);
				const rowDistance = posZ / p;
				const floorStep = (rayDir1.sub(rayDir0)).scale(rowDistance / width);
				const floorPos = camera.position.clone().add(rayDir0.scale(rowDistance));

				for (let x = 0; x < this.width; x++) {
					const cellX = Math.floor(floorPos.x);
					const cellY = Math.floor(floorPos.y);
					let u = floorPos.x - cellX;
					u = u >= 0 ? u : 1 + u;
					let v = floorPos.y - cellY;
					v = v >= 0 ? v : 1 + v;

					let tx: number;
					let ty: number;
					let i: number;
					let j: number;

					if (ceilingTexture) {
						tx = Math.floor(ceilingTexture.width * u);
						ty = Math.floor(ceilingTexture.height * v);
						i = (this.width * y + x) * 4;
						j = (ceilingTexture.width * ty + tx) * 4;
						this.rgba[i + 0] = ceilingTexture.data[j + 0];
						this.rgba[i + 1] = ceilingTexture.data[j + 1];
						this.rgba[i + 2] = ceilingTexture.data[j + 2];
						this.rgba[i + 3] = ceilingTexture.data[j + 3];
					}

					if (floorTexture) {
						tx = Math.floor(floorTexture.width * u);
						ty = Math.floor(floorTexture.height * v);
						i = (this.width * (this.height - 1 - y) + x) * 4;
						j = (floorTexture.width * ty + tx) * 4;
						this.rgba[i + 0] = floorTexture.data[j + 0];
						this.rgba[i + 1] = floorTexture.data[j + 1];
						this.rgba[i + 2] = floorTexture.data[j + 2];
						this.rgba[i + 3] = floorTexture.data[j + 3];
					}

					floorPos.add(floorStep);
				}
			}
		} else {
			let baseFloorLightR = 1;
			let baseFloorLightG = 1;
			let baseFloorLightB = 1;
			let baseCeilingLightR = 1;
			let baseCeilingLightG = 1;
			let baseCeilingLightB = 1;
			if (light) {
				if (floorTexture) {
					const intensity = Math.max(0, light.direction.z);
					baseFloorLightR = light.color.r * intensity + light.ambientColor.r;
					baseFloorLightG = light.color.g * intensity + light.ambientColor.g;
					baseFloorLightB = light.color.b * intensity + light.ambientColor.b;
				}
				if (ceilingTexture) {
					const intensity = Math.max(0, light.direction.z * -1);
					baseCeilingLightR = light.color.r * intensity + light.ambientColor.r;
					baseCeilingLightG = light.color.g * intensity + light.ambientColor.g;
					baseCeilingLightB = light.color.b * intensity + light.ambientColor.b;
				}
			}

			let baseFogR, baseFogG, baseFogB: number;
			if (fog) {
				baseFogR = fog.color.r * 255;
				baseFogG = fog.color.g * 255;
				baseFogB = fog.color.b * 255;
			} else {
				baseFogR = baseFogG = baseFogB = 0;
			}

			for (let y = 0; y < this.height / 2; y++) {
				const rayDir0 = camera.direction.clone().sub(camera.plane);
				const rayDir1 = camera.direction.clone().add(camera.plane);
				const p = Math.abs(y - this.height / 2);
				const rowDistance = posZ / p;
				const floorStep = (rayDir1.sub(rayDir0)).scale(rowDistance / width);
				const floorPos = camera.position.clone().add(rayDir0.scale(rowDistance));
				const f = !fog ? 0 : Math.max(0, Math.min(1, (fog.far - rowDistance) / (fog.far - fog.near)));

				const fogR = (1 - f) * baseFogR;
				const fogG = (1 - f) * baseFogG;
				const fogB = (1 - f) * baseFogB;
				const floorLightR = baseFloorLightR * f;
				const floorLightG = baseFloorLightG * f;
				const floorLightB = baseFloorLightB * f;
				const ceilingLightR = baseCeilingLightR * f;
				const ceilingLightG = baseCeilingLightG * f;
				const ceilingLightB = baseCeilingLightB * f;

				for (let x = 0; x < this.width; x++) {
					const cellX = Math.floor(floorPos.x);
					const cellY = Math.floor(floorPos.y);
					let u = floorPos.x - cellX;
					u = u >= 0 ? u : 1 + u;
					let v = floorPos.y - cellY;
					v = v >= 0 ? v : 1 + v;

					let tx: number;
					let ty: number;
					let i: number;
					let j: number;

					if (ceilingTexture) {
						tx = Math.floor(ceilingTexture.width * u);
						ty = Math.floor(ceilingTexture.height * v);
						i = (this.width * y + x) * 4;
						j = (ceilingTexture.width * ty + tx) * 4;
						this.rgba[i + 0] = fogR + ceilingTexture.data[j + 0] * ceilingLightR;
						this.rgba[i + 1] = fogG + ceilingTexture.data[j + 1] * ceilingLightG;
						this.rgba[i + 2] = fogB + ceilingTexture.data[j + 2] * ceilingLightB;
						this.rgba[i + 3] = ceilingTexture.data[j + 3];
					}

					if (floorTexture) {
						tx = Math.floor(floorTexture.width * u);
						ty = Math.floor(floorTexture.height * v);
						i = (this.width * (this.height - 1 - y) + x) * 4;
						j = (floorTexture.width * ty + tx) * 4;
						this.rgba[i + 0] = fogR + floorTexture.data[j + 0] * floorLightR;
						this.rgba[i + 1] = fogG + floorTexture.data[j + 1] * floorLightG;
						this.rgba[i + 2] = fogB + floorTexture.data[j + 2] * floorLightB;
						this.rgba[i + 3] = floorTexture.data[j + 3];
					}

					floorPos.add(floorStep);
				}
			}
		}

	}

	private draw_wall_vline(
		texture: Texture, x: number, U: number, start: number, end: number,
		lightColor: RGBLike, fog: Fog, distance: number
	): void {
		const rgba = texture.data;
		const w = this.width;
		const dv = 1 / (end - start);
		let v = start < 0 ? -start * dv : 0;

		start = Math.max(start, 0);
		end = Math.min(end, this.height);

		if (!lightColor && !fog) {
			for (let y = start; y < end; y++) {
				const V = (texture.height * v) | 0;
				let i = (w * y + x) * 4;
				let j = (texture.width * V + U) * 4;

				this.rgba[i + 0] = rgba[j + 0];
				this.rgba[i + 1] = rgba[j + 1];
				this.rgba[i + 2] = rgba[j + 2];
				this.rgba[i + 3] = rgba[j + 3];

				v += dv;
			}
		} else {
			let r, g, b: number;
			if (lightColor) {
				r = lightColor.r;
				g = lightColor.g;
				b = lightColor.b;
			} else {
				r = g = b = 1;
			}

			let f = 0;
			let fogR = 1;
			let fogG = 1;
			let fogB = 1;
			if (fog) {
				f = Math.min(1, Math.max(0, (fog.far - distance) / (fog.far - fog.near)));
				r *= f;
				g *= f;
				b *= f;
				fogR = fog.color.r * (1 - f) * 255;
				fogG = fog.color.g * (1 - f) * 255;
				fogB = fog.color.b * (1 - f) * 255;
			}

			for (let y = start; y < end; y++) {
				const V = (texture.height * v) | 0;
				let i = (w * y + x) * 4;
				let j = (texture.width * V + U) * 4;

				this.rgba[i + 0] = fogR + rgba[j + 0] * r;
				this.rgba[i + 1] = fogG + rgba[j + 1] * g;
				this.rgba[i + 2] = fogB + rgba[j + 2] * b;
				this.rgba[i + 3] = rgba[j + 3];

				v += dv;
			}
		}
	}

	private draw_billboard_vline(
		texture: Texture,
		x: number, drawStartY: number, drawEndY: number,
		billboardWidth: number, billboardHeight: number,
		billboardScreenX: number, drawOffsetY: number,
		lightColor: RGBLike, fog: Fog, distance: number
	): void {
		const rgba = texture.data;
		const u = (x - (billboardScreenX - billboardWidth / 2)) / billboardWidth;
		const texX = (u * texture.width) | 0;

		if (!lightColor && !fog) {
			for (let y = drawStartY; y < drawEndY; y++) {
				const v = (y - drawOffsetY - ((this.height - billboardHeight) / 2)) / billboardHeight;
				const texY = (v * texture.height) | 0;
				let i = (this.width * y + x) * 4;
				let j = (texture.width * texY + texX) * 4;
				if (rgba[j + 3] > 0x00) {
					this.rgba[i++] = rgba[j++];
					this.rgba[i++] = rgba[j++];
					this.rgba[i++] = rgba[j++];
					this.rgba[i++] = 0xFF;
				}
			}
		} else {
			let r, g, b: number;

			if (lightColor) {
				r = lightColor.r;
				g = lightColor.g;
				b = lightColor.b;
			} else {
				r = g = b = 1;
			}

			let f: number;
			let fogR, fogG, fogB: number;
			let fR, fG, fB: number;
			if (fog) {
				f = Math.min(1, Math.max(0, (fog.far - distance) / (fog.far - fog.near)));
				const oneMinusF = 1 - f;
				fogR = fog.color.r * oneMinusF * 255;
				fogG = fog.color.g * oneMinusF * 255;
				fogB = fog.color.b * oneMinusF * 255;
				fR = f * r;
				fG = f * g;
				fB = f * b;
			} else {
				f = 0;
				fogR = fogG = fogB = 0;
				fR = r;
				fG = g;
				fB = b;
			}

			for (let y = drawStartY; y < drawEndY; y++) {
				const v = (y - drawOffsetY - ((this.height - billboardHeight) / 2)) / billboardHeight;
				const texY = (v * texture.height) | 0;
				let i = (this.width * y + x) * 4;
				let j = (texture.width * texY + texX) * 4;
				if (rgba[j + 3] > 0x00) {
					this.rgba[i++] = fogR + rgba[j++] * fR;
					this.rgba[i++] = fogG + rgba[j++] * fG;
					this.rgba[i++] = fogB + rgba[j++] * fB;
					this.rgba[i++] = 0xFF;
				}
			}
		}
	}
}
