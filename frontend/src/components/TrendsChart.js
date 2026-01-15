// ==================================================================
// トレンドチャートコンポーネント
// Trends Chart Component
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Radio, Skeleton, Empty } from 'antd';
import styles from './TrendsChart.module.css';

const TrendsChart = ({ data, metric, onMetricChange, loading }) => {

    const getChartOptions = () => {
        const isRevenueMetric = metric === 'projected_revenue';
        
        const series = [];
        
        if (isRevenueMetric) {
            // 「月末まで回収予定額」のシリーズ
            series.push({
                name: '月末まで回収予定額',
                type: 'line',
                data: data.map(item => item.value),
                smooth: true,
                showSymbol: false,
                itemStyle: { color: '#1890ff' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24, 144, 255, 0.3)' }, { offset: 1, color: 'rgba(24, 144, 255, 0)' }] }
                }
            });
            // 「月売上目標」のシリーズ
            series.push({
                name: '月売上目標',
                type: 'line',
                data: data.map(item => item.target),
                smooth: true,
                showSymbol: false,
                lineStyle: { type: 'dashed', color: '#ff4d4f' },
                itemStyle: { color: '#ff4d4f' }
            });
        } else {
            // 「稼働率OCC」のシリーズ
            series.push({
                name: '稼働率OCC',
                type: 'line',
                data: data.map(item => item.value),
                smooth: true,
                showSymbol: false,
                itemStyle: { color: '#52c41a' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82, 196, 26, 0.3)' }, { offset: 1, color: 'rgba(82, 196, 26, 0)' }] }
                }
            });
        }

        return {
            grid: { top: 60, right: 50, bottom: 30, left: 70 },
            legend: { top: 'top', right: '160px' },
            xAxis: {
                type: 'category',
                data: data.map(item => item.date),
                boundaryGap: false,
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: isRevenueMetric ? '¥{value}' : '{value}%'
                }
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params) => {
                    let tooltipText = `${params[0].axisValue}<br/>`;
                    params.forEach(param => {
                        const value = param.value;
                        const formattedValue = isRevenueMetric 
                            ? `¥${(value || 0).toLocaleString()}` 
                            : `${(value || 0).toFixed(1)}%`;
                        tooltipText += `${param.marker} ${param.seriesName}: <strong>${formattedValue}</strong><br/>`;
                    });
                    return tooltipText;
                }
            },
            series: series
        };
    };

    const chartTitle = (
        <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>近30日トレンド</span>
            <Radio.Group value={metric} onChange={(e) => onMetricChange(e.target.value)} buttonStyle="solid">
                <Radio.Button value="projected_revenue">月末まで回収予定額</Radio.Button>
                <Radio.Button value="occupancy_rate_occ">稼働率OCC</Radio.Button>
            </Radio.Group>
        </div>
    );

    return (
        <Card title={chartTitle} className={styles.chartCard}>
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {data.length > 0 ? (
                    <ReactECharts option={getChartOptions()} style={{ height: '350px' }} notMerge={true} />
                ) : (
                    <div className={styles.emptyContainer}>
                        <Empty description="表示するデータがありません" />
                    </div>
                )}
            </Skeleton>
        </Card>
    );
};

export default TrendsChart;
