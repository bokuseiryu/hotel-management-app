// ==================================================================
// 分析カードコンポーネント（同比/環比/予測）
// Analysis Cards Component (YoY/MoM/Prediction)
// ==================================================================

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tooltip, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';
import styles from './AnalysisCards.module.css';

const AnalysisCards = ({ data }) => {
    const {
        mom_change,
        yoy_change,
        predicted_revenue,
        prediction_confidence,
        predicted_achievement_rate,
        monthly_sales_target,
        current_day,
        days_in_month
    } = data;

    // 判断趋势颜色
    const getTrendColor = (value) => {
        if (value === null || value === undefined) return '#8c8c8c';
        return value >= 0 ? '#52c41a' : '#ff4d4f';
    };

    // 判断预测达成率的状态
    const getPredictionStatus = () => {
        if (predicted_achievement_rate >= 100) return { color: '#52c41a', text: '目標達成見込み' };
        if (predicted_achievement_rate >= 90) return { color: '#faad14', text: '要注意' };
        return { color: '#ff4d4f', text: '目標未達の可能性' };
    };

    const predictionStatus = getPredictionStatus();

    return (
        <div className={styles.analysisContainer}>
            <Row gutter={[16, 16]}>
                {/* 環比（与上月对比） */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={styles.analysisCard}>
                        <Statistic
                            title={
                                <Tooltip title="前月との比較">
                                    <span>環比（前月比）</span>
                                </Tooltip>
                            }
                            value={mom_change !== null ? Math.abs(mom_change).toFixed(1) : '-'}
                            precision={1}
                            valueStyle={{ color: getTrendColor(mom_change), fontSize: '24px' }}
                            prefix={mom_change !== null && mom_change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            suffix="%"
                        />
                        {mom_change !== null && (
                            <div className={styles.trendText}>
                                {mom_change >= 0 ? '前月より増加' : '前月より減少'}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* 同比（与去年同月对比） */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={styles.analysisCard}>
                        <Statistic
                            title={
                                <Tooltip title="前年同月との比較">
                                    <span>同比（前年同月比）</span>
                                </Tooltip>
                            }
                            value={yoy_change !== null ? Math.abs(yoy_change).toFixed(1) : '-'}
                            precision={1}
                            valueStyle={{ color: getTrendColor(yoy_change), fontSize: '24px' }}
                            prefix={yoy_change !== null && yoy_change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            suffix="%"
                        />
                        {yoy_change !== null && (
                            <div className={styles.trendText}>
                                {yoy_change >= 0 ? '前年より成長' : '前年より減少'}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* 预测月末业绩 */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={styles.analysisCard}>
                        <Statistic
                            title={
                                <Tooltip title={`${current_day}日間のデータから予測（信頼度: ${prediction_confidence}%）`}>
                                    <span>
                                        <RiseOutlined /> 月末予測売上
                                    </span>
                                </Tooltip>
                            }
                            value={predicted_revenue}
                            precision={0}
                            valueStyle={{ fontSize: '20px' }}
                            prefix="¥"
                        />
                        <Progress 
                            percent={prediction_confidence} 
                            size="small" 
                            showInfo={false}
                            strokeColor="#1890ff"
                        />
                        <div className={styles.confidenceText}>
                            予測信頼度: {prediction_confidence}%
                        </div>
                    </Card>
                </Col>

                {/* 预测达成率 */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={styles.analysisCard}>
                        <Statistic
                            title={
                                <Tooltip title="予測売上に基づく達成率">
                                    <span>予測達成率</span>
                                </Tooltip>
                            }
                            value={predicted_achievement_rate.toFixed(1)}
                            precision={1}
                            valueStyle={{ color: predictionStatus.color, fontSize: '24px' }}
                            suffix="%"
                        />
                        <Tag color={predictionStatus.color} className={styles.statusTag}>
                            {predictionStatus.text}
                        </Tag>
                        {predicted_achievement_rate < 100 && monthly_sales_target > 0 && (
                            <div className={styles.warningText}>
                                <WarningOutlined /> 不足額: ¥{((monthly_sales_target - predicted_revenue) / 1000).toFixed(0)}K
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AnalysisCards;
