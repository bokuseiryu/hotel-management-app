// ==================================================================
// 日報リストコンポーネント
// Reports List Component
// ==================================================================

import React, { useState } from 'react';
import { Card, List, DatePicker, Tag, Typography, Empty, Button } from 'antd';
import EditReportModal from './EditReportModal';
import dayjs from 'dayjs';
import styles from './ReportsList.module.css';

const { Text } = Typography;

const ReportsList = ({ data, month, onMonthChange, loading, userRole }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    const handleEdit = (item) => {
        setSelectedReport(item);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedReport(null);
    };

    const getRateTag = (rate) => {
        const value = parseFloat(rate).toFixed(1);
        if (rate >= 100) {
            return <Tag color="success">{value}%</Tag>;
        }
        return <Tag color="warning">{value}%</Tag>;
    };

    const listTitle = (
        <div className={styles.listHeader}>
            <span className={styles.listTitle}>月次日報リスト</span>
            <DatePicker 
                onChange={(date, dateString) => onMonthChange(dateString)} 
                value={dayjs(month, 'YYYY-MM')}
                picker="month"
                allowClear={false}
            />
        </div>
    );

    return (
        <Card title={listTitle}>
            <List
                itemLayout="vertical"
                dataSource={data}
                loading={loading}
                renderItem={(item) => (
                    <List.Item
                        key={item.id}
                        className={styles.listItem}
                        actions={[
                            <Text>達成率: {getRateTag(item.achievement_rate)}</Text>,
                            ...(userRole === 'admin' ? [
                                <Button type="link" onClick={() => handleEdit(item)}>編集</Button>
                            ] : [])
                        ]}
                    >
                        <List.Item.Meta
                            title={<Text className={styles.itemDate}>{dayjs(item.date).format('YYYY年MM月DD日')}</Text>}
                            description={
                                <div className={styles.itemContent}>
                                    <span>月末まで回収予定額: <Text strong>¥{(item.projected_revenue || 0).toLocaleString()}</Text></span>
                                    <span>稼働率OCC: <Text strong>{(item.occupancy_rate_occ || 0).toFixed(1)}%</Text></span>
                                    <span>平均単価ADR: <Text strong>¥{(item.average_daily_rate_adr || 0).toLocaleString()}</Text></span>
                                    <span>当月累計販売数: <Text strong>{(item.cumulative_sales || 0).toLocaleString()}</Text></span>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                locale={{ emptyText: <Empty description="表示するデータがありません" /> }}
            />
            {selectedReport && (
                <EditReportModal 
                    visible={isModalVisible} 
                    onCancel={handleCancel} 
                    reportData={selectedReport}
                />
            )}
        </Card>
    );
};

export default ReportsList;
