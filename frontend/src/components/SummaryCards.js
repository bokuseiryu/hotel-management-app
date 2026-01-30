// ==================================================================
// サマリーカードコンポーネント
// Summary Cards Component
// ==================================================================

import React from 'react';
import { Card, Row, Col, Statistic, Skeleton } from 'antd';
import styles from './SummaryCards.module.css';

const SummaryCards = ({ data, loading }) => {

    const getStatusStyle = (rate) => {
        if (rate >= 100) {
            return { color: '#52c41a' };
        }
        return { color: '#fa8c16' };
    };

    const getRateCardClass = (rate) => {
        if (rate >= 100) {
            return `${styles.summaryCard} ${styles.rateCard}`;
        }
        return `${styles.summaryCard} ${styles.rateCard} ${styles.rateCardWarning}`;
    };

    const formatRate = (rate) => `${parseFloat(rate || 0).toFixed(1)}%`;
    const formatCurrency = (value) => value || 0;

    return (
        <div className={styles.summaryContainer}>
            <Row gutter={[16, 16]}>
                {/* 月売上目標 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered={false} className={`${styles.summaryCard} ${styles.targetCard}`}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="月売上目標"
                                value={formatCurrency(data.monthly_sales_target)}
                                precision={0}
                                prefix="¥"
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 売上実績 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered={false} className={`${styles.summaryCard} ${styles.revenueCard}`}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="売上実績"
                                value={formatCurrency(data.projected_revenue)}
                                precision={0}
                                prefix="¥"
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 達成率 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered={false} className={getRateCardClass(data.achievement_rate)}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="達成率"
                                value={formatRate(data.achievement_rate)}
                                valueStyle={getStatusStyle(data.achievement_rate)}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 平均単価ADR */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered={false} className={`${styles.summaryCard} ${styles.adrCard}`}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="平均単価ADR"
                                value={formatCurrency(data.average_daily_rate_adr)}
                                precision={0}
                                prefix="¥"
                            />
                        </Skeleton>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SummaryCards;
