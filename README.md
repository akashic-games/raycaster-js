<p align="center">
<img src="https://raw.githubusercontent.com/akashic-games/raycaster-js/master/img/akashic.png">
</p>

# raycaster-js

raycaster-js は raycasting 法によってタイルマップを 3D 描画するソフトウェアレンダラーです。[Akashic Engine](https://akashic-games.github.io/)上での利用を念頭に開発されていますが、単体での利用も可能となっています。

## 利用方法

[Akashic Engine](https://akashic-games.github.io/)で利用する手順を説明します。

[akashic-cli](https://github.com/akashic-games/akashic-cli)をインストールした後、

```sh
akashic install @akashic-extension/raycaster-js
```

でインストールできます。コンテンツからは、

```javascript
var rc = require("@akashic-extension/raycaster-js");
```

で利用してください。

Akashic Engineの詳細な利用方法については、 [公式ページ](https://akashic-games.github.io/) を参照してください。

## サンプル

`sample/` ディレクトリにサンプルが用意されています。詳細は各サンプルの `README.md` を参照してください。

## APIリファレンス

https://akashic-games.github.io/raycaster-js/api/index.html

## ビルド方法

raycaster-js は TypeScript で書かれたライブラリであるため、ビルドには Node.js が必要です。

```sh
npm install
npm run build
```

## ライセンス

本リポジトリは MIT License の元で公開されています。
詳しくは [LICENSE](./LICENSE) をご覧ください。

ただし、画像ファイルおよび音声ファイルは
[CC BY 2.1 JP](https://creativecommons.org/licenses/by/2.1/jp/) の元で公開されています。
