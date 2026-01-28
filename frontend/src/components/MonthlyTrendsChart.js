// ==================================================================
// 月次トレンドチャートコンポーネント
// Monthly Trends Chart Component
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, DatePicker, Skeleton, Empty, Typography } from 'antd';
import styles from './TrendsChart.module.css'; // 既存のスタイルを再利用
import dayjs from 'dayjs';

const { Title } = Typography;

const MonthlyTrendsChart = ({ data, year, onYearChange, loading }) => {
    // データが配列でない場合は空配列を使用
    // Use empty array if data is not an array
    const safeData = Array.isArray(data) ? data : [];

    const getChartOptions = () => {
        if (safeData.length === 0) {
            return null;
        }
        
        const months = safeData.map(item => {
            const monthStr = item.month || item.date?.slice(0, 7) || '';
            const monthNum = parseInt(monthStr.slice(5, 7), 10);
            return `${monthNum}月`;
        });
        const revenues = safeData.map(item => item.projected_revenue || 0);
        const adrs = safeData.map(item => item.average_daily_rate_adr || 0);

        // データが完全に揃っていない月は表示しないというロジック
        // 最初のデータが0の場合、その月以降のデータを表示しない
        const firstZeroIndex = revenues.findIndex((rev, index) => rev === 0 && index > 0 && revenues[index-1] !== 0);
        const displayMonths = firstZeroIndex !== -1 ? months.slice(0, firstZeroIndex) : months;
        const displayRevenues = firstZeroIndex !== -1 ? revenues.slice(0, firstZeroIndex) : revenues;
        const displayAdrs = firstZeroIndex !== -1 ? adrs.slice(0, firstZeroIndex) : adrs;

        if (displayMonths.length === 0) {
            return null; // 表示するデータがない場合はnullを返す
        }

        return {
            grid: { top: 70, right: 50, bottom: 30, left: 70 },
            legend: { top: 'top', data: ['月末まで回収予定額', '平均単価ADR'] },
            xAxis: {
                type: 'category',
                data: displayMonths,
                axisPointer: { type: 'shadow' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '金額 (円)',
                    axisLabel: { formatter: '¥{value}' }
                },
                {
                    type: 'value',
                    name: 'ADR (円)',
                    axisLabel: { formatter: '¥{value}' },
                    splitLine: { show: false }
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params) => {
                    let tooltipText = `${params[0].name}<br/>`;
                    params.forEach(param => {
                        tooltipText += `${param.marker} ${param.seriesName}: <strong>¥${(param.value || 0).toLocaleString()}</strong><br/>`;
                    });
                    return tooltipText;
                }
            },
            series: [
                {
                    name: '月末まで回収予定額',
                    type: 'bar',
                    data: displayRevenues,
                    itemStyle: { color: '#1890ff' }
                },
                {
                    name: '平均単価ADR',
                    type: 'line',
                    yAxisIndex: 1,
                    data: displayAdrs,
                    smooth: true,
                    itemStyle: { color: '#52c41a' }
                }
            ]
        };
    };

    const chartOptions = getChartOptions();

    const chartTitle = (
        <div className={styles.chartHeader}>
            <Title level={5} className={styles.chartTitle}>月次業績トレンド</Title>
            <DatePicker 
                picker="year"
                value={dayjs(year)}
                onChange={(date) => onYearChange(date)}
                allowClear={false}
            />
        </div>
    );

    return (
        <Card title={chartTitle} className={styles.chartCard} style={{ marginTop: '20px' }}>
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {chartOptions ? (
                    <ReactECharts option={chartOptions} style={{ height: '350px' }} notMerge={true} />
                ) : (
                    <div className={styles.emptyContainer}>
                        <Empty description="表示するデータがありません。当年のデータが完全な月次で確定した後に表示されます。" />
                    </div>
                )}
            </Skeleton>
        </Card>
    );
};

export default MonthlyTrendsChart;
