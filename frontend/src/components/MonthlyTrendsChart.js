// ==================================================================
// 当月の日次トレンドチャートコンポーネント
// Current Month Daily Trends Chart Component
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Skeleton, Empty, Typography } from 'antd';
import styles from './TrendsChart.module.css'; // 既存のスタイルを再利用
import dayjs from 'dayjs';

const { Title } = Typography;

const MonthlyTrendsChart = ({ data, loading }) => {

    const getChartOptions = () => {
        if (!data || data.length === 0) {
            return null;
        }

        // 日付を日付のみに変換（例：2024-01-01 → 1日）
        const days = data.map(item => `${parseInt(item.date.slice(-2), 10)}日`);
        const revenues = data.map(item => item.projected_revenue);
        const adrs = data.map(item => item.average_daily_rate_adr);
        const occupancyRates = data.map(item => item.occupancy_rate_occ);

        return {
            grid: { top: 70, right: 50, bottom: 30, left: 70 },
            legend: { top: 'top', data: ['月末まで回収予定額', '平均単価ADR', '稼働率OCC'] },
            xAxis: {
                type: 'category',
                data: days,
                axisPointer: { type: 'shadow' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '金額 (円)',
                    axisLabel: { formatter: '¥{value}' },
                    position: 'left'
                },
                {
                    type: 'value',
                    name: '稼働率 (%)',
                    axisLabel: { formatter: '{value}%' },
                    min: 0,
                    max: 100,
                    position: 'right'
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params) => {
                    let tooltipText = `${params[0].name}<br/>`;
                    params.forEach(param => {
                        if (param.seriesName === '稼働率OCC') {
                            tooltipText += `${param.marker} ${param.seriesName}: <strong>${(param.value || 0).toFixed(1)}%</strong><br/>`;
                        } else {
                            tooltipText += `${param.marker} ${param.seriesName}: <strong>¥${(param.value || 0).toLocaleString()}</strong><br/>`;
                        }
                    });
                    return tooltipText;
                }
            },
            series: [
                {
                    name: '月末まで回収予定額',
                    type: 'bar',
                    data: revenues,
                    itemStyle: { color: '#1890ff' }
                },
                {
                    name: '平均単価ADR',
                    type: 'line',
                    yAxisIndex: 0,
                    data: adrs,
                    smooth: true,
                    itemStyle: { color: '#52c41a' }
                },
                {
                    name: '稼働率OCC',
                    type: 'line',
                    yAxisIndex: 1,
                    data: occupancyRates,
                    smooth: true,
                    itemStyle: { color: '#fa8c16' }
                }
            ]
        };
    };

    const chartOptions = getChartOptions();
    const currentMonth = dayjs().format('YYYY年MM月');

    const chartTitle = (
        <div className={styles.chartHeader}>
            <Title level={5} className={styles.chartTitle}>{currentMonth} 日次業績トレンド</Title>
        </div>
    );

    return (
        <Card title={chartTitle} className={styles.chartCard} style={{ marginTop: '20px' }}>
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {chartOptions ? (
                    <ReactECharts option={chartOptions} style={{ height: '350px' }} notMerge={true} />
                ) : (
                    <div className={styles.emptyContainer}>
                        <Empty description="表示するデータがありません。当月のデータが入力されると表示されます。" />
                    </div>
                )}
            </Skeleton>
        </Card>
    );
};

export default MonthlyTrendsChart;
