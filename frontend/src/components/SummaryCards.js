// ==================================================================
// サマリーカードコンポーネント
// Summary Cards Component
// ==================================================================

import React from 'react';
import { Card, Row, Col, Statistic, Skeleton, Progress } from 'antd';
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
            
            {/* 目標達成率プログレスバー */}
            <Card bordered={false} className={styles.progressCard}>
                <Skeleton loading={loading} active paragraph={{ rows: 2 }}>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span className={styles.progressTitle}>📊 目標達成進捗</span>
                            <span className={styles.progressPercent}>{formatRate(data.achievement_rate)}</span>
                        </div>
                        <Progress
                            percent={Math.min(parseFloat(data.achievement_rate || 0), 100)}
                            strokeColor={{
                                '0%': data.achievement_rate >= 100 ? '#52c41a' : '#ff7a45',
                                '100%': data.achievement_rate >= 100 ? '#73d13d' : '#ff4d4f',
                            }}
                            trailColor="#f0f0f0"
                            strokeWidth={16}
                            showInfo={false}
                            className={styles.progressBar}
                        />
                        <div className={styles.progressFooter}>
                            <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>実績</span>
                                <span className={styles.progressValue}>¥{formatCurrency(data.projected_revenue).toLocaleString()}</span>
                            </div>
                            <div className={styles.progressInfo}>
                                <span className={styles.progressLabel}>目標</span>
                                <span className={styles.progressValue}>¥{formatCurrency(data.monthly_sales_target).toLocaleString()}</span>
                            </div>
                            {data.achievement_rate < 100 && (
                                <div className={styles.progressInfo}>
                                    <span className={styles.progressLabel}>差額</span>
                                    <span className={styles.progressValueGap}>-¥{(formatCurrency(data.monthly_sales_target) - formatCurrency(data.projected_revenue)).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </Skeleton>
            </Card>
        </div>
    );
};

export default SummaryCards;
