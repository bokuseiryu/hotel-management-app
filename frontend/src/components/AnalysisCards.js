// ==================================================================
// 分析カードコンポーネント（同比/環比/予測）
// Analysis Cards Component (YoY/MoM/Prediction)
// ==================================================================

import React from 'react';
import { Card, Row, Col, Statistic, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './AnalysisCards.module.css';

const AnalysisCards = ({ data }) => {
    // 数据为空时的默认处理
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    const momChange = data.mom_change;
    const yoyChange = data.yoy_change;

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
            </Row>
        </div>
    );
};

export default AnalysisCards;
