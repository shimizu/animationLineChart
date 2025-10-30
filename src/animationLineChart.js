import * as d3 from 'd3';

/**
 * D3.jsを使用してラインチャートを描画、操作するクラス
 */
export default class AnimationLineChart {
  /**
   * @param {string} elementId - チャートを描画するコンテナ要素のID
   */
  constructor(elementId, options = {}) {
    // DOM要素とD3セレクション
    this.containerId = elementId;
    this.container = d3.select(`#${this.containerId}`);

    // データとSVG要素
    this.data = null;
    this.svg = null;
    this.g = null; // チャート要素を格納するSVGグループ
    this.linesGroup = null; // ラインを格納するSVGグループ

    // スケール
    this.xScale = null;
    this.yScale = null;

    // リサイズ監視
    this.resizeObserver = null;

    // ラベル管理
    this.customLabels = {}; // 追加されたカスタムラベルを管理するオブジェクト
    this.customLabelGroup = null; // カスタムラベルを格納するSVGグループ

    // 表示状態管理
    this.visibleLines = new Set();

    // デフォルト設定
    const defaults = {
      margin: { top: 30, right: 30, bottom: 30, left: 50 },
      xDomain: [1990, 2024],
      yDomain: [0, 50],
      dataUrl: null,
      series: []
    };

    // デフォルトとオプションをマージ
    this.config = { ...defaults, ...options };
    this.series = this.config.series;
  }

  /**
   * チャートの初期化処理
   * データの読み込み、初回描画、リサイズ監視を開始する
   */
  async init() {
    if (!this.config.dataUrl || !this.config.series || this.config.series.length === 0) {
      console.error('dataUrl and series must be provided in the options.');
      return;
    }
    await this.loadData(this.config.dataUrl);
    this.drawChart();
    this.initResizeObserver();
  }

  /**
   * TSV形式のデータを非同期で読み込み、クラス内で利用可能な形式に変換する
   */
  async loadData(url) {
    const rawData = await d3.csv(url, d3.autoType);

    // Group data by year
    const groupedData = d3.group(rawData, d => d.year);

    // Transform the grouped data into the wide format
    this.data = Array.from(groupedData, ([year, values]) => {
      const row = { year };
      values.forEach(v => {
        row[v.key] = v.value;
      });
      return row;
    });

    // 各データ行において、値がNULLであっても全てのシリーズキーが存在することを保証する
    this.data.forEach(d => {
      this.series.forEach(s => {
        if (!d.hasOwnProperty(s.key)) {
          d[s.key] = null;
        }
      });
    });
  }

  /**
   * チャートの描画・再描画を行う
   * リサイズ時にも呼び出され、SVG全体をクリアして再構築する
   */
  drawChart() {
    // コンテナサイズから描画領域の幅と高さを計算
    const containerRect = this.container.node().getBoundingClientRect();
    const width = containerRect.width - this.config.margin.left - this.config.margin.right;
    const height = containerRect.height - this.config.margin.top - this.config.margin.bottom;

    // コンテナをクリア
    this.container.html('');

    // SVG要素と描画グループ(g)を作成
    this.svg = this.container.append('svg')
      .attr('width', containerRect.width)
      .attr('height', containerRect.height);

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

    // Add a clip-path
    this.svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    // X軸とY軸のスケールを設定
    this.xScale = d3.scaleLinear()
      .domain(this.config.xDomain)
      .range([0, width]);

    this.yScale = d3.scaleLinear()
      .domain(this.config.yDomain)
      .range([height, 0]);

    // グリッド線を描画
    this.g.append('g')
      .attr('class', 'x-grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(this.xScale).tickSize(-height).tickFormat(''));

    this.g.append('g')
      .attr('class', 'y-grid')
      .call(d3.axisLeft(this.yScale).tickSize(-width).tickFormat(''));

    // X軸とY軸を描画
    this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')));

    this.g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale));

    this.adjustTicks();

    // Create a group for the lines and apply the clip-path
    this.linesGroup = this.g.append('g')
      .attr('clip-path', 'url(#clip)');

    // 各データ系列のラインを描画
    this.series.forEach(s => {
      const line = d3.line()
        .defined(d => d[s.key] !== null)
        .x(d => this.xScale(d.year))
        .y(d => this.yScale(d[s.key]))
        .curve(d3.curveMonotoneX);

      const path = this.linesGroup.append('path')
        .datum(this.data)
        .attr('class', `line line-${s.key}`)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      if (this.visibleLines.has(s.key)) {
        path.attr('stroke-dasharray', null);
      } else {
        // アニメーションの初期状態として、ラインを非表示にする
        const length = path.node().getTotalLength();
        path.attr('stroke-dasharray', `${length} ${length}`)
            .attr('stroke-dashoffset', length);
      }
    });


    // カスタムラベル用のグループを作成
    this.customLabelGroup = this.g.append('g').attr('class', 'custom-labels');

    // 既存のカスタムラベルを再描画
    const existingLabels = { ...this.customLabels };
    this.customLabels = {};
    Object.entries(existingLabels).forEach(([id, labelInfo]) => {
        this.addLabel(id, { data: labelInfo.data, style: { ...labelInfo.style, fadeIn: false } });
    });
  }

  /**
   * チャートにカスタムラベルを追加する
   * @param {string} id - ラベルの一意なID
   * @param {object} options - ラベルのデータとスタイル
   */
  addLabel(id, options = {}) {
    if (!id || this.customLabels[id]) {
      // console.warn(`ラベルID '${id}' が見つからないか、既に存在します。`);
      return;
    }

    const { data = {}, style = {} } = options;
    if (data.year === undefined || data.value === undefined) {
      console.warn('addLabelには data.year と data.value が必要です。');
      return;
    }

    const labelTexts = data.label.split('_');

    const defaultStyle = {
      color: '#000',
      fontSize: '12px',
      textAnchor: 'start',
      fadeIn: false,
      delay: 0,
      duration: 300
    };
    const finalStyle = { ...defaultStyle, ...style };

    const x = this.xScale(data.year);
    const y = this.yScale(data.value);

    const label = this.customLabelGroup.append('text')
      .attr('class', `custom-label custom-label-${id}`)
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle');

    labelTexts.forEach((text, i) => {
      label.append('tspan')
        .attr('x', x)
        .attr('dy', `${i === 0 ? 0 : 1.2}em`)
        .text(text || '');
    });

    // フェードインアニメーション
    if (finalStyle.fadeIn) {
      label.style('opacity', 0)
        .transition()
        .delay(finalStyle.delay)
        .duration(finalStyle.duration)
        .style('opacity', 1);
    }

    // ラベル情報を保存
    this.customLabels[id] = { element: label, data, style: finalStyle };
  }

  /**
   * チャートからカスタムラベルを削除する
   * @param {string} id - 削除するラベルのID
   * @param {object} options - アニメーションのオプション
   */
  removeLabel(id, options = {}) {
    const labelInfo = this.customLabels[id];
    if (!labelInfo) {
      // console.warn(`ラベルID '${id}' が見つかりません。`);
      return;
    }

    const { fadeOut = false, delay = 0, duration = 300 } = options;

    // フェードアウトアニメーション
    if (fadeOut) {
      labelInfo.element.transition()
        .delay(delay)
        .duration(duration)
        .style('opacity', 0)
        .on('end', () => {
          labelInfo.element.remove();
          delete this.customLabels[id];
        });
    } else {
      labelInfo.element.remove();
      delete this.customLabels[id];
    }
  }

  /**
   * 指定されたキーのラインを描画するアニメーション
   * @param {string} lineKey - seriesで定義されたキー
   * @param {object} options - アニメーションのオプション
   */
  animateLine(lineKey, { delay = 0, duration = 700 } = {}) {
    if (this.visibleLines.has(lineKey)) {
      return; // ラインが既に表示済み(アニメーション済み)の場合は何もしない
    }

    const path = this.linesGroup.select(`.line-${lineKey}`);
    if (path.empty()) {
      console.warn(`キーが ${lineKey} のラインが見つかりません。`);
      return;
    }

    const length = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${length} ${length}`)
        .transition()
        .delay(delay)
        .duration(duration)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0)
        .on('end', () => {
            // アニメーション完了後、通常の線に戻す
            path.attr('stroke-dasharray', null);
            this.visibleLines.add(lineKey);
        });
  }

  /**
   * 指定されたキーのラインを非表示（リセット）状態に戻す
   * @param {string} lineKey - seriesで定義されたキー
   */
  resetLine(lineKey) {
    const path = this.linesGroup.select(`.line-${lineKey}`);
    if (path.empty()) {
      console.warn(`キーが ${lineKey} のラインが見つかりません。`);
      return;
    }

    this.visibleLines.delete(lineKey);
    const length = path.node().getTotalLength();
    path.transition().duration(0)
        .attr('stroke-dasharray', `${length} ${length}`)
        .attr('stroke-dashoffset', length);
  }

  /**
   * すべてのラインをリセットする
   */
  resetAllLine() {
    this.series.forEach(s => {
        this.resetLine(s.key);
    });
  }

  /**
   * すべてのカスタムラベルを削除する
   * @param {object} options - アニメーションのオプション
   */
  removeAllLabel(options = {}) {
    const allLabelIds = Object.keys(this.customLabels);
    allLabelIds.forEach(id => {
        this.removeLabel(id, options);
    });
  }

  /**
   * 軸のドメイン（範囲）をアニメーション付きで変更する
   * @param {object} options - xDomain, yDomain, durationを含むオブジェクト
   */
  setAxisRanges({ xDomain, yDomain, duration = 1000 }) {
    if (xDomain) {
      this.config.xDomain = xDomain;
      this.xScale.domain(xDomain);
    }
    if (yDomain) {
      this.config.yDomain = yDomain;
      this.yScale.domain(yDomain);
    }

    //トランジションの設定を反映する
    const t = this.svg.transition().duration(duration);

    //チャートコンテナのサイズを取得する
    const containerRect = this.container.node().getBoundingClientRect();
    const width = containerRect.width - this.config.margin.left - this.config.margin.right;
    const height = containerRect.height - this.config.margin.top - this.config.margin.bottom;

    // 軸とグリッドをアニメーションで更新
    this.g.select('.x-axis').transition(t).call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')));
    this.g.select('.y-axis').transition(t).call(d3.axisLeft(this.yScale));
    this.g.select('.x-grid').transition(t).call(d3.axisBottom(this.xScale).tickSize(-height).tickFormat(''));
    this.g.select('.y-grid').transition(t).call(d3.axisLeft(this.yScale).tickSize(-width).tickFormat(''));
    this.adjustTicks();

    // ラインとラベルを状態に応じて更新
    this.series.forEach(s => {
      const path = this.linesGroup.select(`.line-${s.key}`);
      const isHidden = path.attr('stroke-dasharray') && parseFloat(path.attr('stroke-dashoffset')) > 0;


      //ライン描画関数を生成
      const line = d3.line()
        .defined(d => d[s.key] !== null)
        .x(d => this.xScale(d.year))
        .y(d => this.yScale(d[s.key]))
        .curve(d3.curveMonotoneX);

      if (isHidden) {
        // 非表示のラインは、裏で形状を更新して非表示を維持
        path.attr('d', line(this.data));
        const newLength = path.node().getTotalLength();
        path.attr('stroke-dasharray', `${newLength} ${newLength}`)
            .attr('stroke-dashoffset', newLength);
      } else {
        // 表示中のラインは、形状をアニメーションさせる
        path.transition(t)
            .attr('d', line(this.data));
      }
    });

    // カスタムラベルの位置をアニメーションで更新
    Object.values(this.customLabels).forEach(labelInfo => {
        labelInfo.element.transition(t)
            .attr('x', this.xScale(labelInfo.data.year))
            .attr('y', this.yScale(labelInfo.data.value));
    });
  }

  //x軸を横幅に合わせて調整する  
  adjustTicks() {
    const adjust = ()=>{
      const width = document.querySelector("#lineChart").clientWidth;
      const ticks = document.querySelectorAll('.x-axis .tick');
      
      // 全て表示をリセット
      ticks.forEach(t => t.style.display = '');

      //tickが7以下のときは何もしない
      if(ticks.length <= 7 ) return 
  
      if (width <= 500) {
        ticks.forEach((tick, i) => {
          // 偶数番目のtickを非表示にする（半分間引く）
            if(i % 2 === 1)tick.style.display = 'none';
        });
      }
    }
    
    setTimeout(adjust, 1000)
  }

  /**
   * コンテナ要素のリサイズを監視するResizeObserverを初期化する
   */
  initResizeObserver() {
    let resizeTimer;
    this.resizeObserver = new ResizeObserver(entries => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        for (let entry of entries) {
          if(entry.contentBoxSize) {
            this.drawChart();
            this.adjustTicks();
          }
        }
      }, 200); // 200msのデバウンス
    });
    this.resizeObserver.observe(this.container.node());
  }
}
