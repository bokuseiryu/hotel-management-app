// ==================================================================
// 月次トレンドチャートコンポーネント
// Monthly Trends Chart Component
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, DatePicker, Skeleton, Empty, Typography } from 'antd';
import styles from './TrendsChart.module.css';
import dayjs from 'dayjs';

const { Title } = Typography;

const MonthlyTrendsChart = ({ data, forecastData, year, onYearChange, loading }) => {
    // データが配列でない場合は空配列を使用
    const safeData = Array.isArray(data) ? data : [];
    
    // 現在の月を取得
    const currentMonth = dayjs().month() + 1; // 1-12
    const currentYear = dayjs().year();
    const selectedYear = parseInt(year, 10);

    const getChartOptions = () => {
        // 月次データを準備（1月〜12月）
        const months = [];
        const revenues = [];
        const adrs = [];
        const occupancyRates = [];
        const isForecast = []; // 予測データかどうかのフラグ

        // 既存の月次データをマップに変換
        const dataMap = {};
        safeData.forEach(item => {
            const monthStr = item.month || item.date?.slice(0, 7) || '';
            const monthNum = parseInt(monthStr.slice(5, 7), 10);
            dataMap[monthNum] = item;
        });

        // 翌月・翌々月の計算
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextNextMonth = currentMonth >= 11 ? (currentMonth === 11 ? 1 : 2) : currentMonth + 2;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        const nextNextMonthYear = currentMonth >= 11 ? currentYear + 1 : currentYear;

        // 1月〜12月のデータを構築
        for (let m = 1; m <= 12; m++) {
            months.push(`${m}月`);
            
            if (dataMap[m]) {
                // 既存データがある場合
                revenues.push(dataMap[m].projected_revenue || 0);
                adrs.push(dataMap[m].average_daily_rate_adr || 0);
                occupancyRates.push(dataMap[m].occupancy_rate || 0);
                isForecast.push(false);
            } else if (selectedYear === nextMonthYear && m === nextMonth && forecastData?.next_month_revenue > 0) {
                // 翌月の予測データ
                revenues.push(forecastData.next_month_revenue);
                adrs.push(forecastData.next_month_adr || 0);
                occupancyRates.push(forecastData.next_month_occupancy_rate || 0);
                isForecast.push(true);
            } else if (selectedYear === nextNextMonthYear && m === nextNextMonth && forecastData?.next_next_month_revenue > 0) {
                // 翌々月の予測データ
                revenues.push(forecastData.next_next_month_revenue);
                adrs.push(forecastData.next_next_month_adr || 0);
                occupancyRates.push(forecastData.next_next_month_occupancy_rate || 0);
                isForecast.push(true);
            } else {
                revenues.push(0);
                adrs.push(0);
                occupancyRates.push(0);
                isForecast.push(false);
            }
        }

        // データがすべて0の場合はnullを返す
        const hasData = revenues.some(v => v > 0) || (forecastData?.next_month_revenue > 0) || (forecastData?.next_next_month_revenue > 0);
        if (!hasData) {
            return null;
        }

        return {
            grid: { top: 80, right: 80, bottom: 50, left: 80 },
            legend: { 
                top: 'top', 
                data: ['売上実績', '翌月予測', '翌々月予測', 'ADR'],
                textStyle: { fontSize: 12 }
            },
            xAxis: {
                type: 'category',
                data: months,
                axisPointer: { type: 'shadow' },
                axisLabel: {
                    formatter: (value, index) => {
                        // 翌月・翌々月にマークを付ける
                        if (selectedYear === nextMonthYear && index + 1 === nextMonth) {
                            return `{highlight|${value}}\n{sub|(翌月)}`;
                        }
                        if (selectedYear === nextNextMonthYear && index + 1 === nextNextMonth) {
                            return `{highlight2|${value}}\n{sub|(翌々月)}`;
                        }
                        return value;
                    },
                    rich: {
                        highlight: { color: '#1890ff', fontWeight: 'bold' },
                        highlight2: { color: '#722ed1', fontWeight: 'bold' },
                        sub: { fontSize: 10, color: '#8c8c8c' }
                    }
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '売上 (円)',
                    axisLabel: { formatter: (value) => `¥${(value / 10000).toFixed(0)}万` }
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
                    const monthIndex = params[0].dataIndex;
                    let label = params[0].name;
                    
                    // 予測データの場合はラベルを追加
                    if (selectedYear === nextMonthYear && monthIndex + 1 === nextMonth) {
                        label += ' (翌月予測)';
                    } else if (selectedYear === nextNextMonthYear && monthIndex + 1 === nextNextMonth) {
                        label += ' (翌々月予測)';
                    }
                    
                    let tooltipText = `<strong>${label}</strong><br/>`;
                    params.forEach(param => {
                        if (param.value > 0) {
                            tooltipText += `${param.marker} ${param.seriesName}: <strong>¥${(param.value || 0).toLocaleString()}</strong><br/>`;
                        }
                    });
                    return tooltipText;
                }
            },
            series: [
                {
                    name: '売上実績',
                    type: 'bar',
                    data: revenues.map((v, i) => ({
                        value: isForecast[i] ? 0 : v,
                        itemStyle: { color: '#1890ff' }
                    })),
                    barWidth: '25%'
                },
                {
                    name: '翌月予測',
                    type: 'bar',
                    data: revenues.map((v, i) => ({
                        value: (selectedYear === nextMonthYear && i + 1 === nextMonth && isForecast[i]) ? v : 0,
                        itemStyle: { 
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#69c0ff' },
                                    { offset: 1, color: '#1890ff' }
                                ]
                            },
                            borderColor: '#1890ff',
                            borderWidth: 2,
                            borderType: 'dashed'
                        }
                    })),
                    barWidth: '25%'
                },
                {
                    name: '翌々月予測',
                    type: 'bar',
                    data: revenues.map((v, i) => ({
                        value: (selectedYear === nextNextMonthYear && i + 1 === nextNextMonth && isForecast[i]) ? v : 0,
                        itemStyle: { 
                            color: {
                                type: 'linear',
                                x: 0, y: 0, x2: 0, y2: 1,
                                colorStops: [
                                    { offset: 0, color: '#b37feb' },
                                    { offset: 1, color: '#722ed1' }
                                ]
                            },
                            borderColor: '#722ed1',
                            borderWidth: 2,
                            borderType: 'dashed'
                        }
                    })),
                    barWidth: '25%'
                },
                {
                    name: 'ADR',
                    type: 'line',
                    yAxisIndex: 1,
                    data: adrs,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: { color: '#52c41a' },
                    lineStyle: { width: 2 }
                }
            ]
        };
    };

    const chartOptions = getChartOptions();

    // 翌月・翌々月の情報を表示
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextNextMonth = currentMonth >= 11 ? (currentMonth === 11 ? 1 : 2) : currentMonth + 2;

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
                {/* 翌月・翌々月の予測データサマリー */}
                {(forecastData?.next_month_revenue > 0 || forecastData?.next_next_month_revenue > 0) && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '16px', 
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                    }}>
                        {forecastData?.next_month_revenue > 0 && (
                            <div style={{ 
                                padding: '8px 16px', 
                                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                                borderRadius: '8px',
                                border: '1px dashed #1890ff'
                            }}>
                                <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                    {nextMonth}月（翌月）予測:
                                </span>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                    ¥{(forecastData.next_month_revenue || 0).toLocaleString()}
                                </span>
                                {forecastData.next_month_occupancy_rate > 0 && (
                                    <span style={{ marginLeft: '12px', color: '#52c41a' }}>
                                        稼働率: {forecastData.next_month_occupancy_rate}%
                                    </span>
                                )}
                            </div>
                        )}
                        {forecastData?.next_next_month_revenue > 0 && (
                            <div style={{ 
                                padding: '8px 16px', 
                                background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                                borderRadius: '8px',
                                border: '1px dashed #722ed1'
                            }}>
                                <span style={{ color: '#722ed1', fontWeight: 'bold' }}>
                                    {nextNextMonth}月（翌々月）予測:
                                </span>
                                <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                    ¥{(forecastData.next_next_month_revenue || 0).toLocaleString()}
                                </span>
                                {forecastData.next_next_month_occupancy_rate > 0 && (
                                    <span style={{ marginLeft: '12px', color: '#52c41a' }}>
                                        稼働率: {forecastData.next_next_month_occupancy_rate}%
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {chartOptions ? (
                    <ReactECharts option={chartOptions} style={{ height: '350px' }} notMerge={true} />
                ) : (
                    <div className={styles.emptyContainer}>
                        <Empty description="表示するデータがありません。データを登録してください。" />
                    </div>
                )}
            </Skeleton>
        </Card>
    );
};

export default MonthlyTrendsChart;
