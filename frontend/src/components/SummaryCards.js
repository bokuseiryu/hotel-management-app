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
            return { color: '#389e0d', backgroundColor: 'rgba(56, 158, 13, 0.1)' };
        }
        return { color: '#d46b08', backgroundColor: 'rgba(212, 107, 8, 0.1)' };
    };

    const formatRate = (rate) => `${parseFloat(rate || 0).toFixed(1)}%`;
    const formatCurrency = (value) => value || 0;

    return (
        <div className={styles.summaryContainer}>
            <Row gutter={[16, 16]}>
                {/* 月売上目標 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered className={styles.summaryCard}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="月売上目標"
                                value={formatCurrency(data.monthly_sales_target)}
                                precision={0}
                                prefix="¥"
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 月末まで回収予定額 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered className={styles.summaryCard}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="月末まで回収予定額"
                                value={formatCurrency(data.projected_revenue)}
                                precision={0}
                                prefix="¥"
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 達成率 */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered className={`${styles.summaryCard} ${styles.rateCard}`}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="達成率"
                                value={formatRate(data.achievement_rate)}
                                valueStyle={{
                                    fontWeight: 'bold',
                                    ...getStatusStyle(data.achievement_rate)
                                }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                {/* 平均単価ADR */}
                <Col xs={24} sm={12} md={12} lg={6}>
                    <Card bordered className={styles.summaryCard}>
                        <Skeleton loading={loading} active paragraph={{ rows: 1 }}>
                            <Statistic
                                title="平均単価ADR"
                                value={formatCurrency(data.average_daily_rate_adr)}
                                precision={0}
                                prefix="¥"
                                valueStyle={{ fontWeight: 'bold' }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SummaryCards;
