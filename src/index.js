import './index.scss'
import AnimationLineChart from './animationLineChart.js';

document.addEventListener('DOMContentLoaded', async () => {
    const chartOptions = {
      dataUrl: './data/example.csv',
      series: [
        { key: 'USA', label: 'USA', color: '#e41a1c' },
        { key: 'China', label: 'China', color: '#377eb8' },
        { key: 'Japan', label: 'Japan', color: '#4daf4a' },
        { key: 'Germany', label: 'Germany', color: '#984ea3' }
      ],
      xDomain: [2000, 2023],
      yDomain: [0, 220]
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
        default: [2000, 2023],
        zoomed: [2010, 2020]
    };

    const yDomains = {
        default: [0, 220],
        zoomed: [50, 150]
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