// ==================================================================
// 日報編集モーダルコンポーネント
// Edit Report Modal Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, message, Popconfirm, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const EditReportModal = ({ visible, onCancel, reportData }) => {
    const [form] = Form.useForm();
    const { apiClient } = useAuth();
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

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
                average_daily_rate_adr: values.average_daily_rate_adr
            });
            message.success('データが正常に更新されました。');
            onCancel();
            window.location.reload();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'データの更新に失敗しました。';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleteLoading(true);
            await apiClient.delete(`/data/reports/${reportData.id}`);
            message.success('データが正常に削除されました。');
            onCancel();
            window.location.reload();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'データの削除に失敗しました。';
            message.error(errorMessage);
        } finally {
            setDeleteLoading(false);
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
            footer={[
                <Popconfirm
                    key="delete"
                    title="このデータを削除しますか？"
                    description="削除したデータは復元できません。"
                    onConfirm={handleDelete}
                    okText="削除"
                    cancelText="キャンセル"
                    okButtonProps={{ danger: true, loading: deleteLoading }}
                >
                    <Button danger icon={<DeleteOutlined />} loading={deleteLoading}>
                        削除
                    </Button>
                </Popconfirm>,
                <Button key="cancel" onClick={onCancel}>
                    キャンセル
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                    更新する
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Form.Item name="date" label="日付">
                    <DatePicker style={{ width: '100%' }} disabled />
                </Form.Item>
                <Form.Item name="projected_revenue" label="売上実績" rules={[{ required: true, message: '売上実績を入力してください' }]}>
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
