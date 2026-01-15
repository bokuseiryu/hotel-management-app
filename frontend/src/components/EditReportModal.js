// ==================================================================
// 日報編集モーダルコンポーネント
// Edit Report Modal Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const EditReportModal = ({ visible, onCancel, reportData }) => {
    const [form] = Form.useForm();
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (reportData) {
            form.setFieldsValue({
                ...reportData,
                date: dayjs(reportData.date)
            });
        } else {
            form.resetFields();
        }
    }, [reportData, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            await apiClient.put(`/data/reports/${reportData.id}`, {
                projected_revenue: values.projected_revenue,
                occupancy_rate_occ: values.occupancy_rate_occ,
                cumulative_sales: values.cumulative_sales,
                average_daily_rate_adr: values.average_daily_rate_adr,
                monthly_sales_target: values.monthly_sales_target
            });
            message.success('データが正常に更新されました。');
            onCancel(); // モーダルを閉じる
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'データの更新に失敗しました。';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`日報データ編集 (${reportData ? dayjs(reportData.date).format('YYYY年MM月DD日') : ''})`}
            visible={visible}
            onOk={handleOk}
            onCancel={onCancel}
            confirmLoading={loading}
            okText="更新する"
            cancelText="キャンセル"
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item name="date" label="日付">
                    <DatePicker style={{ width: '100%' }} disabled />
                </Form.Item>
                <Form.Item name="monthly_sales_target" label="月売上目標" rules={[{ required: true, message: '月売上目標を入力してください' }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="projected_revenue" label="月末まで回収予定額" rules={[{ required: true, message: '月末まで回収予定額を入力してください' }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="occupancy_rate_occ" label="稼働率OCC" rules={[{ required: true, message: '稼働率OCCを入力してください' }]}>
                    <InputNumber suffix="%" style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="cumulative_sales" label="当月累計販売数" rules={[{ required: true, message: '当月累計販売数を入力してください' }]}>
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item name="average_daily_rate_adr" label="平均単価ADR" rules={[{ required: true, message: '平均単価ADRを入力してください' }]}>
                    <InputNumber prefix="¥" style={{ width: '100%' }} min={0} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default EditReportModal;
