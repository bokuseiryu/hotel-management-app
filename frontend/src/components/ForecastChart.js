// ==================================================================
// 翌月・翌々月予測チャートコンポーネント
// Forecast Chart Component (Next Month & Month After Next)
// ==================================================================

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, Skeleton, Empty, Typography, Row, Col, Statistic } from 'antd';
import styles from './TrendsChart.module.css';
import dayjs from 'dayjs';

const { Title } = Typography;

const ForecastChart = ({ data, loading }) => {
    // 最新のデータから翌月・翌々月の予測データを取得
    const latestData = data || {};
    
    // 現在の月を基準に翌月・翌々月を計算
    const currentMonth = dayjs();
    const nextMonth = currentMonth.add(1, 'month');
    const nextNextMonth = currentMonth.add(2, 'month');

    const hasNextMonthData = latestData.next_month_revenue > 0 || 
                              latestData.next_month_occupancy_rate > 0 || 
                              latestData.next_month_adr > 0;
    
    const hasNextNextMonthData = latestData.next_next_month_revenue > 0 || 
                                  latestData.next_next_month_occupancy_rate > 0 || 
                                  latestData.next_next_month_adr > 0;

    const hasForecastData = hasNextMonthData || hasNextNextMonthData;

    const getChartOptions = () => {
        if (!hasForecastData) {
            return null;
        }

        const months = [
            `${nextMonth.format('M')}月（翌月）`,
            `${nextNextMonth.format('M')}月（翌々月）`
        ];

        const revenues = [
            latestData.next_month_revenue || 0,
            latestData.next_next_month_revenue || 0
        ];

        const occupancyRates = [
            latestData.next_month_occupancy_rate || 0,
            latestData.next_next_month_occupancy_rate || 0
        ];

        const adrs = [
            latestData.next_month_adr || 0,
            latestData.next_next_month_adr || 0
        ];

        return {
            grid: { top: 80, right: 80, bottom: 30, left: 80 },
            legend: { 
                top: 'top', 
                data: ['回収予定額', '稼働率', 'ADR'],
                textStyle: { fontSize: 12 }
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLabel: { fontSize: 12, fontWeight: 'bold' }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '金額 (円)',
                    position: 'left',
                    axisLabel: { formatter: '¥{value}' }
                },
                {
                    type: 'value',
                    name: '稼働率 (%)',
                    position: 'right',
                    max: 100,
                    axisLabel: { formatter: '{value}%' },
                    splitLine: { show: false }
                }
            ],
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params) => {
                    let tooltipText = `<strong>${params[0].name}</strong><br/>`;
                    params.forEach(param => {
                        if (param.seriesName === '稼働率') {
                            tooltipText += `${param.marker} ${param.seriesName}: <strong>${param.value}%</strong><br/>`;
                        } else {
                            tooltipText += `${param.marker} ${param.seriesName}: <strong>¥${(param.value || 0).toLocaleString()}</strong><br/>`;
                        }
                    });
                    return tooltipText;
                }
            },
            series: [
                {
                    name: '回収予定額',
                    type: 'bar',
                    data: revenues,
                    itemStyle: { 
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#1890ff' },
                                { offset: 1, color: '#096dd9' }
                            ]
                        }
                    },
                    barWidth: '30%'
                },
                {
                    name: '稼働率',
                    type: 'line',
                    yAxisIndex: 1,
                    data: occupancyRates,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 10,
                    itemStyle: { color: '#52c41a' },
                    lineStyle: { width: 3 }
                },
                {
                    name: 'ADR',
                    type: 'bar',
                    data: adrs,
                    itemStyle: { 
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#722ed1' },
                                { offset: 1, color: '#531dab' }
                            ]
                        }
                    },
                    barWidth: '30%'
                }
            ]
        };
    };

    const chartOptions = getChartOptions();

    return (
        <Card 
            title={
                <div className={styles.chartHeader}>
                    <Title level={5} className={styles.chartTitle}>📈 翌月・翌々月予測データ</Title>
                </div>
            }
            className={styles.chartCard} 
            style={{ marginTop: '20px' }}
        >
            <Skeleton loading={loading} active paragraph={{ rows: 6 }}>
                {hasForecastData ? (
                    <>
                        {/* 統計カード */}
                        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                            <Col xs={24} sm={12}>
                                <Card size="small" style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: 'none' }}>
                                    <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
                                        {nextMonth.format('M')}月（翌月）
                                    </Title>
                                    <Row gutter={8}>
                                        <Col span={8}>
                                            <Statistic 
                                                title="回収予定額" 
                                                value={latestData.next_month_revenue || 0} 
                                                prefix="¥"
                                                valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <Statistic 
                                                title="稼働率" 
                                                value={latestData.next_month_occupancy_rate || 0} 
                                                suffix="%"
                                                valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <Statistic 
                                                title="ADR" 
                                                value={latestData.next_month_adr || 0} 
                                                prefix="¥"
                                                valueStyle={{ fontSize: '14px', color: '#722ed1' }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Card size="small" style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', border: 'none' }}>
                                    <Title level={5} style={{ color: '#722ed1', marginBottom: '12px' }}>
                                        {nextNextMonth.format('M')}月（翌々月）
                                    </Title>
                                    <Row gutter={8}>
                                        <Col span={8}>
                                            <Statistic 
                                                title="回収予定額" 
                                                value={latestData.next_next_month_revenue || 0} 
                                                prefix="¥"
                                                valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <Statistic 
                                                title="稼働率" 
                                                value={latestData.next_next_month_occupancy_rate || 0} 
                                                suffix="%"
                                                valueStyle={{ fontSize: '14px', color: '#52c41a' }}
                                            />
                                        </Col>
                                        <Col span={8}>
                                            <Statistic 
                                                title="ADR" 
                                                value={latestData.next_next_month_adr || 0} 
                                                prefix="¥"
                                                valueStyle={{ fontSize: '14px', color: '#722ed1' }}
                                            />
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        </Row>
                        
                        {/* チャート */}
                        <ReactECharts option={chartOptions} style={{ height: '300px' }} notMerge={true} />
                    </>
                ) : (
                    <div className={styles.emptyContainer}>
                        <Empty description="翌月・翌々月の予測データがありません。データ管理パネルから入力してください。" />
                    </div>
                )}
            </Skeleton>
        </Card>
    );
};

export default ForecastChart;
