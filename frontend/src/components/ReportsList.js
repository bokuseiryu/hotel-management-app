// ==================================================================
// 日報リストコンポーネント
// Reports List Component
// ==================================================================

import React, { useState } from 'react';
import { Card, List, DatePicker, Tag, Typography, Empty, Button, Collapse } from 'antd';
import EditReportModal from './EditReportModal';
import dayjs from 'dayjs';
import styles from './ReportsList.module.css';

const { Text } = Typography;
const { Panel } = Collapse;

const ReportsList = ({ data, month, onMonthChange, loading, userRole }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    // 默认展开最新一条记录（第一条）
    // Default to expand only the latest record (first item)
    const [activeKeys, setActiveKeys] = useState(data.length > 0 ? [data[0]?.id || '0'] : []);

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
            {loading ? (
                <List loading={true} />
            ) : data.length > 0 ? (
                <Collapse 
                    activeKey={activeKeys} 
                    onChange={setActiveKeys}
                    accordion={false}
                >
                    {data.map((item, index) => (
                        <Panel 
                            header={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text className={styles.itemDate}>{dayjs(item.date).format('YYYY年MM月DD日')}</Text>
                                    {userRole === 'admin' && (
                                        <Button 
                                            type="link" 
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(item);
                                            }}
                                        >
                                            編集
                                        </Button>
                                    )}
                                </div>
                            }
                            key={item.id || index}
                        >
                            <div className={styles.itemContent}>
                                <span>月末まで回収予定額: <Text strong>¥{(item.projected_revenue || 0).toLocaleString()}</Text></span>
                                <span>稼働率OCC: <Text strong>{(item.occupancy_rate_occ || 0).toFixed(1)}%</Text></span>
                                <span>平均単価ADR: <Text strong>¥{(item.average_daily_rate_adr || 0).toLocaleString()}</Text></span>
                                <span>当月累計販売数: <Text strong>{(item.cumulative_sales || 0).toLocaleString()}</Text></span>
                            </div>
                        </Panel>
                    ))}
                </Collapse>
            ) : (
                <Empty description="表示するデータがありません" />
            )}
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
