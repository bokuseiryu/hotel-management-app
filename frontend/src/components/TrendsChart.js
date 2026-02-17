// ==================================================================
// トレンドチャートコンポーネント
// Trends Chart Component
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Radio, Skeleton, Empty, Tooltip } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import styles from './TrendsChart.module.css';
import { isHoliday, isWeekend, getHolidayName } from '../utils/japanHolidays';

const TrendsChart = ({ data, metric, onMetricChange, loading }) => {
    // データが配列でない場合は空配列を使用
    // Use empty array if data is not an array
    const safeData = Array.isArray(data) ? data : [];

    const getChartOptions = () => {
        const isRevenueMetric = metric === 'projected_revenue';
        
        // 祝日・週末のマークポイントを生成
        const markPoints = safeData
            .filter(item => isHoliday(item.date) || isWeekend(item.date))
            .map(item => ({
                coord: [item.date, item.value],
                symbol: 'circle',
                symbolSize: isHoliday(item.date) ? 12 : 8,
                itemStyle: {
                    color: isHoliday(item.date) ? '#ff4d4f' : '#faad14'
                },
                label: {
                    show: false
                }
            }));

        const series = [];
        
        if (isRevenueMetric) {
            // 「売上実績」のシリーズ
            series.push({
                name: '売上実績',
                type: 'line',
                data: safeData.map(item => item.value),
                smooth: true,
                showSymbol: false,
                itemStyle: { color: '#1890ff' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24, 144, 255, 0.3)' }, { offset: 1, color: 'rgba(24, 144, 255, 0)' }] }
                },
                markPoint: {
                    data: markPoints,
                    animation: false
                }
            });
            // 「売上目標/月」のシリーズ
            series.push({
                name: '売上目標/月',
                type: 'line',
                data: safeData.map(item => item.target),
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
                data: safeData.map(item => item.value),
                smooth: true,
                showSymbol: false,
                itemStyle: { color: '#52c41a' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82, 196, 26, 0.3)' }, { offset: 1, color: 'rgba(82, 196, 26, 0)' }] }
                },
                markPoint: {
                    data: markPoints,
                    animation: false
                }
            });
        }

        return {
            grid: { top: 60, right: 50, bottom: 30, left: 70 },
            legend: { top: 'top', right: '160px' },
            xAxis: {
                type: 'category',
                data: safeData.map(item => item.date),
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
                    const dateStr = params[0].axisValue;
                    const holidayName = getHolidayName(dateStr);
                    const weekend = isWeekend(dateStr);
                    
                    let tooltipText = `<strong>${dateStr}</strong>`;
                    if (holidayName) {
                        tooltipText += ` <span style="color:#ff4d4f">🎌 ${holidayName}</span>`;
                    } else if (weekend) {
                        tooltipText += ` <span style="color:#faad14">📅 週末</span>`;
                    }
                    tooltipText += '<br/>';
                    
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
            <div className={styles.chartControls}>
                <Tooltip title="赤丸: 祝日 / 黄丸: 週末">
                    <span className={styles.holidayLegend}>
                        <CalendarOutlined /> <span className={styles.holidayDot}>●</span>祝日 <span className={styles.weekendDot}>●</span>週末
                    </span>
                </Tooltip>
                <Radio.Group value={metric} onChange={(e) => onMetricChange(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="projected_revenue">売上実績</Radio.Button>
                    <Radio.Button value="occupancy_rate_occ">稼働率OCC</Radio.Button>
                </Radio.Group>
            </div>
        </div>
    );

    return (
        <Card title={chartTitle} className={styles.chartCard}>
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {safeData.length > 0 ? (
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
