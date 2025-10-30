# animationLineCHart

アニメーション機能付きのラインチャート

+ リサイズ二対応
+ axisの変化に対応

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
    { key: 'USA', label: 'USA', color: '#e41a1c' },
    { key: 'China', label: 'China', color: '#377eb8' },
    { key: 'Japan', label: 'Japan', color: '#4daf4a' },
    { key: 'Germany', label: 'Germany', color: '#984ea3' }
  ],
  xDomain: [2000, 2023], // X軸の範囲 (任意)
  yDomain: [0, 220]      // Y軸の範囲 (任意)
};

// チャートインスタンスを作成
const lineChart = new AnimationLineChart(chartContainerId, chartOptions);

// チャートを初期化
lineChart.init();
```

### 3. データ形式

データは`year`, `key`, `value`のカラムを持つCSV形式で用意します。`key`は`series`オプションで定義した`key`と一致する必要があります。

```csv
year,key,value
2020,USA,100
2020,China,120
2021,USA,110
2021,China,130
...
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
// Chinaのラインをリセット
lineChart.resetLine('China');

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