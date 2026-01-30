// ==================================================================
// 日報リストコンポーネント
// Reports List Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Card, DatePicker, Typography, Empty, Button, Collapse } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import EditReportModal from './EditReportModal';
import dayjs from 'dayjs';
import styles from './ReportsList.module.css';

const { Text } = Typography;
const { Panel } = Collapse;

// デフォルトで表示する件数
// Default number of items to display
const DEFAULT_DISPLAY_COUNT = 5;

const ReportsList = ({ data, month, onMonthChange, loading, userRole }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    // リストを展開/折りたたむ状態
    // State to expand/collapse the list
    const [isExpanded, setIsExpanded] = useState(false);
    // 詳細を展開するアイテム
    // Items with expanded details
    const [expandedItems, setExpandedItems] = useState([]);
    
    // データが変わったらリセット
    useEffect(() => {
        setIsExpanded(false);
        setExpandedItems(data.length > 0 ? [data[0]?.id || '0'] : []);
    }, [data, month]);

    const handleEdit = (item) => {
        setSelectedReport(item);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedReport(null);
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
    
    // 表示するデータ（展開状態によって変わる）
    // Data to display (changes based on expanded state)
    const displayData = isExpanded ? data : data.slice(0, DEFAULT_DISPLAY_COUNT);
    const hasMoreData = data.length > DEFAULT_DISPLAY_COUNT;

    return (
        <Card title={listTitle}>
            {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>
            ) : data.length > 0 ? (
                <>
                    <Collapse 
                        activeKey={expandedItems} 
                        onChange={setExpandedItems}
                        accordion={false}
                    >
                        {displayData.map((item, index) => (
                            <Panel 
                                header={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text className={styles.itemDate}>{dayjs(item.date).format('YYYY年MM月DD日')}</Text>
                                        {(userRole === 'admin' || userRole === 'manager') && (
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
                                    <span>売上実績: <Text strong>¥{(item.projected_revenue || 0).toLocaleString()}</Text></span>
                                    <span>稼働率OCC: <Text strong>{(item.occupancy_rate_occ || 0).toFixed(1)}%</Text></span>
                                    <span>平均単価ADR: <Text strong>¥{(item.average_daily_rate_adr || 0).toLocaleString()}</Text></span>
                                    <span>当月累計販売数: <Text strong>{(item.cumulative_sales || 0).toLocaleString()}</Text></span>
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                    {hasMoreData && (
                        <div style={{ textAlign: 'center', marginTop: '16px' }}>
                            <Button 
                                type="link" 
                                onClick={() => setIsExpanded(!isExpanded)}
                                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                            >
                                {isExpanded ? `折りたたむ` : `すべて表示 (${data.length}件)`}
                            </Button>
                        </div>
                    )}
                </>
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
