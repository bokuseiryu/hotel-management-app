// ==================================================================
// 智能预警横幅组件
// Smart Alert Banner Component
// ==================================================================

import React from 'react';
import { Alert, Space } from 'antd';
import { WarningOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styles from './AlertBanner.module.css';

const AlertBanner = ({ data }) => {
    const {
        achievement_rate,
        predicted_achievement_rate,
        occupancy_rate_occ,
        average_daily_rate_adr,
        current_day,
        days_in_month
    } = data;

    const alerts = [];

    // 预警1: 达成率低于80%
    if (achievement_rate > 0 && achievement_rate < 80) {
        alerts.push({
            type: 'error',
            message: '達成率警告',
            description: `現在の達成率が${achievement_rate.toFixed(1)}%と低い水準です。売上向上策の検討が必要です。`,
            icon: <WarningOutlined />
        });
    }

    // 预警2: 预测达成率低于90%
    if (predicted_achievement_rate > 0 && predicted_achievement_rate < 90 && current_day >= 10) {
        alerts.push({
            type: 'warning',
            message: '目標未達の可能性',
            description: `月末予測では達成率${predicted_achievement_rate.toFixed(1)}%となる見込みです。追加施策の実施を推奨します。`,
            icon: <ExclamationCircleOutlined />
        });
    }

    // 预警3: 稼働率低于60%
    if (occupancy_rate_occ > 0 && occupancy_rate_occ < 60) {
        alerts.push({
            type: 'warning',
            message: '稼働率低下',
            description: `稼働率が${occupancy_rate_occ.toFixed(1)}%と低い状態です。プロモーション施策の検討が必要です。`,
            icon: <ExclamationCircleOutlined />
        });
    }

    // 预警4: 平均单价异常低（需要历史数据对比，这里简化处理）
    if (average_daily_rate_adr > 0 && average_daily_rate_adr < 4000) {
        alerts.push({
            type: 'info',
            message: '平均単価が低め',
            description: `ADRが¥${average_daily_rate_adr.toLocaleString()}です。価格戦略の見直しを検討してください。`,
            icon: <InfoCircleOutlined />
        });
    }

    // 提示5: 预测达成率超过100%时的鼓励信息
    if (predicted_achievement_rate >= 100 && current_day >= 10) {
        alerts.push({
            type: 'success',
            message: '目標達成見込み',
            description: `現在のペースで進めば、月末には目標を達成できる見込みです（予測達成率: ${predicted_achievement_rate.toFixed(1)}%）。`,
            icon: <InfoCircleOutlined />
        });
    }

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className={styles.alertContainer}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {alerts.map((alert, index) => (
                    <Alert
                        key={index}
                        message={alert.message}
                        description={alert.description}
                        type={alert.type}
                        icon={alert.icon}
                        showIcon
                        closable
                        className={styles.alert}
                    />
                ))}
            </Space>
        </div>
    );
};

export default AlertBanner;
