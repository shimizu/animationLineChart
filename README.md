# animationLineCHart

アニメーション機能付きのラインチャート

+ リサイズに対応
+ axisの変化に対応

# デモ
https://shimizu.github.io/animationLineChart/


## インストール

```bash
git clone git@github.com:shimizu/prejs-minimum-template.git
cd prejs-minimum-template
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## デプロイ

```bash
npm run deploy
```

## Usage

### 1. HTMLの準備

チャートを表示するためのコンテナ要素をHTMLに用意します。

```html
<div id="myChart"></div>
```

### 2. ライブラリのインポートと初期化

`AnimationLineChart`クラスをインポートし、チャートのインスタンスを作成します。

```javascript
import AnimationLineChart from './animationLineChart.js';

// チャートのコンテナIDを指定
const chartContainerId = 'myChart';

// チャートのオプションを設定
const chartOptions = {
  dataUrl: './data/example.csv', // データのURL (必須)
  series: [ // データ系列の定義 (必須)
    { key: 'イギリス', label: 'イギリス', color: '#e41a1c' },
    { key: 'カナダ', label: 'カナダ', color: '#377eb8' },
    { key: '米国', label: '米国', color: '#4daf4a' },
  ],
  xDomain: [1990, 2023], // X軸の範囲 (任意)
  yDomain: [0, 225000]      // Y軸の範囲 (任意)
};

// チャートインスタンスを作成
const lineChart = new AnimationLineChart(chartContainerId, chartOptions);

// チャートを初期化
lineChart.init();
```

### 3. データ形式

データは`year`, `key`, `value`のカラムを持つCSV形式で用意します。`key`は`series`オプションで定義した`key`と一致する必要があります。

```csv
key,ISO,year,value
イギリス,GB,1992,56.0005285
イギリス,GB,1993,619.9407226
イギリス,GB,1994,869.8935275
カナダ,CA,1990,40690.17589
カナダ,CA,1991,47685.56967
カナダ,CA,1992,57897.47406
米国,US,1990,2422.919766
米国,US,1991,3659.795321
米国,US,1992,6124.419544
```

### 4. 公開メソッド

#### ラインのアニメーション

`animateLine(lineKey, options)`メソッドで、指定したデータ系列のラインをアニメーション描画します。

```javascript
// USAのラインをアニメーション
lineChart.animateLine('USA', { delay: 0, duration: 1000 });

// すべてのラインを順番にアニメーション
lineChart.series.forEach((s, i) => {
    lineChart.animateLine(s.key, { delay: i * 500, duration: 1000 });
});
```

#### ラインのリセット

`resetLine(lineKey)`または`resetAllLine()`で、ラインを非表示状態に戻します。

```javascript
// イギリスのラインをリセット
lineChart.resetLine('イギリス');

// すべてのラインをリセット
lineChart.resetAllLine();
```

#### 軸の範囲変更

`setAxisRanges(options)`で、軸の表示範囲をアニメーション付きで変更できます。

```javascript
lineChart.setAxisRanges({
  xDomain: [2010, 2020],
  yDomain: [50, 150],
  duration: 1000
});
```

#### カスタムラベル

`addLabel(id, options)`と`removeLabel(id, options)`で、チャート上にカスタムラベルを追加・削除できます。

```javascript
// ラベルを追加
lineChart.addLabel('my-label', {
  data: { year: 2015, value: 150, label: 'My Label' },
  style: { fadeIn: true }
});

// ラベルを削除
lineChart.removeLabel('my-label', { fadeOut: true });
```