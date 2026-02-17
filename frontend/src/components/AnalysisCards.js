// ==================================================================
// 分析カードコンポーネント（同比/環比/予測）
// Analysis Cards Component (YoY/MoM/Prediction)
// ==================================================================

import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tooltip, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';
import styles from './AnalysisCards.module.css';

const AnalysisCards = ({ data }) => {
    // 数据为空时的默认处理
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    // 安全获取数值，确保不会是undefined
    const safeNumber = (val, defaultVal = 0) => {
        if (val === null || val === undefined || isNaN(val)) return defaultVal;
        return Number(val);
    };

    const momChange = data.mom_change;
    const yoyChange = data.yoy_change;
    const predictedRevenue = safeNumber(data.predicted_revenue);
    const predictionConfidence = safeNumber(data.prediction_confidence);
    const predictedAchievementRate = safeNumber(data.predicted_achievement_rate);
    const monthlySalesTarget = safeNumber(data.monthly_sales_target);
    const currentDay = safeNumber(data.current_day);

    // 判断趋势颜色
    const getTrendColor = (value) => {
        if (value === null || value === undefined) return '#8c8c8c';
        return value >= 0 ? '#52c41a' : '#ff4d4f';
    };

    // 安全格式化数字
    const formatChange = (val) => {
        if (val === null || val === undefined) return '-';
        return Math.abs(val).toFixed(1);
    };

    // 判断预测达成率的状态
    const getPredictionStatus = () => {
        if (predictedAchievementRate >= 100) return { color: '#52c41a', text: '目標達成見込み' };
        if (predictedAchievementRate >= 90) return { color: '#faad14', text: '要注意' };
        return { color: '#ff4d4f', text: '目標未達の可能性' };
    };

    const predictionStatus = getPredictionStatus();
    const hasValidMom = momChange !== null && momChange !== undefined;
    const hasValidYoy = yoyChange !== null && yoyChange !== undefined;

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
                            value={formatChange(momChange)}
                            valueStyle={{ color: getTrendColor(momChange), fontSize: '24px' }}
                            prefix={hasValidMom ? (momChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : null}
                            suffix={hasValidMom ? "%" : ""}
                        />
                        {hasValidMom && (
                            <div className={styles.trendText}>
                                {momChange >= 0 ? '前月より増加' : '前月より減少'}
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
                            value={formatChange(yoyChange)}
                            valueStyle={{ color: getTrendColor(yoyChange), fontSize: '24px' }}
                            prefix={hasValidYoy ? (yoyChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />) : null}
                            suffix={hasValidYoy ? "%" : ""}
                        />
                        {hasValidYoy && (
                            <div className={styles.trendText}>
                                {yoyChange >= 0 ? '前年より成長' : '前年より減少'}
                            </div>
                        )}
                    </Card>
                </Col>

                {/* 预测月末业绩 */}
                <Col xs={24} sm={12} lg={6}>
                    <Card className={styles.analysisCard}>
                        <Statistic
                            title={
                                <Tooltip title={`${currentDay}日間のデータから予測（信頼度: ${predictionConfidence}%）`}>
                                    <span>
                                        <RiseOutlined /> 月末予測売上
                                    </span>
                                </Tooltip>
                            }
                            value={predictedRevenue}
                            precision={0}
                            valueStyle={{ fontSize: '20px' }}
                            prefix="¥"
                        />
                        <Progress 
                            percent={predictionConfidence} 
                            size="small" 
                            showInfo={false}
                            strokeColor="#1890ff"
                        />
                        <div className={styles.confidenceText}>
                            予測信頼度: {predictionConfidence}%
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
                            value={predictedAchievementRate.toFixed(1)}
                            valueStyle={{ color: predictionStatus.color, fontSize: '24px' }}
                            suffix="%"
                        />
                        <Tag color={predictionStatus.color} className={styles.statusTag}>
                            {predictionStatus.text}
                        </Tag>
                        {predictedAchievementRate < 100 && monthlySalesTarget > 0 && predictedRevenue > 0 && (
                            <div className={styles.warningText}>
                                <WarningOutlined /> 不足額: ¥{Math.round((monthlySalesTarget - predictedRevenue) / 1000)}K
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AnalysisCards;
