import * as rc from "@akashic-extension/raycaster-js";

let isSkipping = false;

g.game.skippingChanged.add(skipping => {
	isSkipping = skipping;
});

/**
 * イメージアセットからテクスチャを生成します。
 *
 * @param imageAsset テクスチャにするイメージのアセット。
 */
function createTexture(imageAsset: g.ImageAsset): rc.Texture {
	const surface = g.game.resourceFactory.createSurface(imageAsset.width, imageAsset.height);

	const renderer = surface.renderer();

	renderer.begin();
	renderer.drawImage(imageAsset.asSurface(), 0, 0, imageAsset.width, imageAsset.height, 0, 0);
	renderer.end();

	// `_getImageData()` がサポートされていない環境では imageData が null になります。
	const imageData = renderer._getImageData(0, 0, surface.width, surface.height);

	return {
		width: surface.width,
		height: surface.height,
		data: imageData ? imageData.data : null
	};
}

/**
 * 押している間コールバック関数を実行するボタンを生成する。
 *
 * @param x ボタンのX座標。
 * @param y ボタンのY座標。
 * @param size ボタンの大きさ。縦・横の長さ。
 * @param callback コールバック関数。
 */
function createHoldDownButton(scene: g.Scene, x: number, y: number, size: number, callback: () => void): g.E {
	const button = new g.FilledRect({
		scene: scene,
		x: x,
		y: y,
		width: size,
		height: size,
		cssColor: "green",
		touchable: true
	});

	let pressed = false;
	button.pointDown.add(() => { pressed = true; });
	button.pointUp.add(() => { pressed = false; });
	button.update.add(() => { if (pressed) callback(); });

	return button;
}

/**
 * 与えられた座標がタイルマップの外や壁の中にあるとき、真を返す。
 *
 * @param tilemap タイルマップ。
 * @param pos 座標。
 */
function tilemapHitTest(tilemap: rc.Tilemap, pos: rc.Vector2Like): boolean {
	if (pos.x < 0 || pos.y < 0 || pos.x >= tilemap.width || pos.y >= tilemap.height) {
		return true;
	}
	const x = Math.floor(pos.x);
	const y = Math.floor(pos.y);
	return tilemap.map[tilemap.width * y + x] > 0;
}

function main(param: g.GameMainParameterObject): void {
	// raycaster-js でレンダリングするための surface を作成します。
	// 低い解像度でレンダリングすることで、低スペックのPCやスマートフォンでも動作するようにします。
	const width = g.game.width / 2;
	const height = g.game.height / 2;
	const surface = g.game.resourceFactory.createSurface(width, height);
	const renderer = surface.renderer();
	const imageData = renderer._getImageData(0, 0, surface.width, surface.height);

	// `_getImageData()` がサポートされていない環境では imageData が null になります。
	// その時は raycaster による描画を行わないようにします。
	const raycaster = imageData ? new rc.Raycaster(imageData) : null;

	// カメラを (1.5, 1.5) の位置に生成します。
	const camera = new rc.Camera(1.5, 1.5, Math.PI * 3 / 4, g.game.width / g.game.height);

	// raycaster-js がレンダリングするマップです。
	// 1 以上の数は壁があることを示します。壁があるところでは、
	// その数から 1 を引いた値をテクスチャ配列の添字として
	// 用います。
	const tilemap: rc.Tilemap = {
		width: 10,
		height: 10,
		map: [
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 2, 0, 0, 0, 1,
			1, 0, 0, 0, 2, 2, 2, 0, 0, 1,
			1, 0, 0, 2, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 2, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
			1, 1, 1, 1, 1, 1, 1, 1, 1, 1
		]
	};

	// マップの壁のレンダリングで用いられるテクスチャの配列です。
	// シーンのロードが完了すると、この配列にテクスチャを格納します。
	const textures: rc.Texture[] = [];
	let floorTexture: rc.Texture;
	let ceilingTexture: rc.Texture;

	const scene = new g.Scene({
		game: g.game,
		assetIds: [
			"brick",
			"stone",
			"soil",
			"floor",
			"ceiling"
		]
	});

	scene.loaded.add(() => {
		[
			"brick",
			"stone",
			"soil"
		].forEach(assetId => textures.push(createTexture(scene.assets[assetId] as g.ImageAsset)));

		floorTexture = createTexture(scene.assets["floor"] as g.ImageAsset);
		ceilingTexture = createTexture(scene.assets["ceiling"] as g.ImageAsset);

		// raycaster-js の描画結果を表示するためのスプライト。
		const screen = new g.Sprite({
			scene: scene,
			src: surface,
			x: (g.game.width - surface.width) / 2,
			y: (g.game.height - surface.height) / 2,
			scaleX: g.game.width / surface.width,
			scaleY: g.game.height / surface.height
		});

		// 移動ボタンの生成。
		const buttonSize = 64;
		const padding = 8;
		let x = g.game.width - (buttonSize + padding) * 3;
		const y = g.game.height - (buttonSize + padding);
		const speed = 1 / g.game.fps;
		const angSpeed = Math.PI / g.game.fps;

		const moveLeftButton = createHoldDownButton(scene, x, y, buttonSize, () => {
			camera.rotate(-angSpeed);
		});

		x += buttonSize + padding;
		const moveBackwardButton = createHoldDownButton(scene, x, y, buttonSize, () => {
			const prevX = camera.position.x;
			const prevY = camera.position.y;
			camera.moveLocal(0, -speed);
			if (tilemapHitTest(tilemap, camera.position)) {
				camera.position.x = prevX;
				camera.position.y = prevY;
			}
		});

		const moveForwardButton = createHoldDownButton(scene, x, y - (buttonSize + padding), buttonSize, () => {
			const prevX = camera.position.x;
			const prevY = camera.position.y;
			camera.moveLocal(0, speed);
			if (tilemapHitTest(tilemap, camera.position)) {
				camera.position.x = prevX;
				camera.position.y = prevY;
			}
		});

		x += buttonSize + padding;
		const moveRightButton = createHoldDownButton(scene, x, y, buttonSize, () => {
			camera.rotate(angSpeed);
		});

		scene.append(screen);
		scene.append(moveLeftButton);
		scene.append(moveBackwardButton);
		scene.append(moveForwardButton);
		scene.append(moveRightButton);
	});

	scene.update.add(() => {
		if (raycaster && !isSkipping) {
			// raycaster による 3D レンダリングを行います。
			raycaster.render({ tilemap, textures, billboards: null, floorTexture, ceilingTexture, camera });
			renderer._putImageData(imageData, 0, 0);
			scene.modified();
		}
	});

	g.game.pushScene(scene);
}

export = main;
