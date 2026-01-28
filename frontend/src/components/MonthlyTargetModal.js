// ==================================================================
// 月次売上目標設定モーダルコンポーネント
// Monthly Sales Target Setting Modal Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Table, Button, Select, message, Typography, Spin } from 'antd';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const MonthlyTargetModal = ({ visible, onClose, selectedHotel, onTargetUpdated }) => {
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [targets, setTargets] = useState([]);
    const [fiscalYear, setFiscalYear] = useState(() => {
        // 現在の月を取得し、3月以降なら今年、1-2月なら前年を会計年度とする
        // Get current month, if March or later use current year, if Jan-Feb use previous year
        const now = dayjs();
        const month = now.month() + 1; // 0-indexed
        return month >= 3 ? now.year().toString() : (now.year() - 1).toString();
    });

    // 会計年度の月リストを生成（3月〜翌年2月）
    // Generate month list for fiscal year (March to February of next year)
    const generateMonthList = (year) => {
        const months = [];
        const yearNum = parseInt(year);
        
        // 3月〜12月
        for (let m = 3; m <= 12; m++) {
            months.push({
                month: `${yearNum}-${m.toString().padStart(2, '0')}`,
                label: `${yearNum}年${m}月`,
                sales_target: 0
            });
        }
        // 翌年1月〜2月
        for (let m = 1; m <= 2; m++) {
            months.push({
                month: `${yearNum + 1}-${m.toString().padStart(2, '0')}`,
                label: `${yearNum + 1}年${m}月`,
                sales_target: 0
            });
        }
        
        return months;
    };

    // 目標データを取得
    // Fetch target data
    const fetchTargets = async () => {
        if (!apiClient || !selectedHotel) return;
        
        setLoading(true);
        try {
            const response = await apiClient.get('/targets', {
                params: {
                    hotel: selectedHotel,
                    fiscal_year: fiscalYear
                }
            });
            
            // 月リストを生成し、既存のデータをマージ
            const monthList = generateMonthList(fiscalYear);
            const existingTargets = response.data || [];
            
            const mergedTargets = monthList.map(item => {
                const existing = existingTargets.find(t => t.month === item.month);
                return {
                    ...item,
                    sales_target: existing ? existing.sales_target : 0,
                    id: existing ? existing.id : null
                };
            });
            
            setTargets(mergedTargets);
        } catch (error) {
            console.error('目標データの取得に失敗しました:', error);
            message.error('目標データの取得に失敗しました。');
            // エラー時でも月リストを表示
            setTargets(generateMonthList(fiscalYear));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchTargets();
        }
    }, [visible, fiscalYear, selectedHotel]);

    // 目標値を変更
    // Handle target value change
    const handleTargetChange = (month, value) => {
        setTargets(prev => prev.map(item => 
            item.month === month ? { ...item, sales_target: value || 0 } : item
        ));
    };

    // 保存処理
    // Save targets
    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.post('/targets', {
                hotel_name: selectedHotel,
                fiscal_year: fiscalYear,
                targets: targets.map(t => ({
                    month: t.month,
                    sales_target: t.sales_target
                }))
            });
            
            message.success('月次売上目標が保存されました。');
            onTargetUpdated && onTargetUpdated();
            onClose();
        } catch (error) {
            console.error('保存に失敗しました:', error);
            message.error('保存に失敗しました。');
        } finally {
            setSaving(false);
        }
    };

    // テーブルカラム定義
    // Table column definitions
    const columns = [
        {
            title: '月',
            dataIndex: 'label',
            key: 'label',
            width: 120,
        },
        {
            title: '月売上目標',
            dataIndex: 'sales_target',
            key: 'sales_target',
            render: (value, record) => (
                <InputNumber
                    value={value}
                    onChange={(val) => handleTargetChange(record.month, val)}
                    formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/¥\s?|(,*)/g, '')}
                    style={{ width: '100%' }}
                    min={0}
                />
            ),
        },
    ];

    // 会計年度の選択肢を生成
    // Generate fiscal year options
    const currentYear = dayjs().year();
    const yearOptions = [];
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        yearOptions.push(y.toString());
    }

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span>月次売上目標設定</span>
                    <Select
                        value={fiscalYear}
                        onChange={setFiscalYear}
                        style={{ width: 150 }}
                    >
                        {yearOptions.map(year => (
                            <Option key={year} value={year}>
                                {year}年度 (3月〜2月)
                            </Option>
                        ))}
                    </Select>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={500}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    キャンセル
                </Button>,
                <Button key="save" type="primary" onClick={handleSave} loading={saving}>
                    保存
                </Button>
            ]}
        >
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                ホテル: {selectedHotel}
            </Typography.Text>
            
            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={targets}
                    rowKey="month"
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                />
            </Spin>
        </Modal>
    );
};

export default MonthlyTargetModal;
