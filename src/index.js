import './index.scss'
import AnimationLineChart from './animationLineChart.js';

document.addEventListener('DOMContentLoaded', async () => {
    const chartOptions = {
      margin: { top: 30, right: 30, bottom: 30, left: 60 },
      dataUrl: './data/example.csv',
      series: [
        { key: 'イギリス', label: 'イギリス', color: '#e41a1c' },
        { key: 'カナダ', label: 'カナダ', color: '#377eb8' },
        { key: '米国', label: '米国', color: '#4daf4a' },
      ],
      xDomain: [1990, 2023],
      yDomain: [0, 225000]
    };

    // チャートインスタンス作成
    const lineChart = new AnimationLineChart('lineChart', chartOptions);
    await lineChart.init();

    const animateButton = document.getElementById('animateButton');
    animateButton.addEventListener('click', () => {
        // Reset all lines before animating
        lineChart.resetAllLine();

        // Animate each line with a delay
        lineChart.series.forEach((s, i) => {
            lineChart.animateLine(s.key, { delay: i * 500, duration: 1000 });
        });
    });

    const toggleXButton = document.getElementById('toggleX');
    const toggleYButton = document.getElementById('toggleY');

    let xState = 'default';
    let yState = 'default';

    const xDomains = {
        default: [1990, 2023],
        zoomed: [2010, 2020]
    };

    const yDomains = {
        default: [0, 225000],
        zoomed: [0, 80000]
    };

    toggleXButton.addEventListener('click', () => {
        xState = xState === 'default' ? 'zoomed' : 'default';
        lineChart.setAxisRanges({ xDomain: xDomains[xState] });
    });

    toggleYButton.addEventListener('click', () => {
        yState = yState === 'default' ? 'zoomed' : 'default';
        lineChart.setAxisRanges({ yDomain: yDomains[yState] });
    });
});