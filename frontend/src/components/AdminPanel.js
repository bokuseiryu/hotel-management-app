// ==================================================================
// 管理者パネルコンポーネント
// Admin Panel Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, DatePicker, message, Card, Typography, Divider } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import MonthlyTargetModal from './MonthlyTargetModal';
import dayjs from 'dayjs';

const { Title } = Typography;

const AdminPanel = ({ selectedHotel, onDataUpdated }) => {
    const [form] = Form.useForm();
    const { apiClient } = useAuth();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [exportYear, setExportYear] = useState(dayjs());
    const [exportLoading, setExportLoading] = useState(false);
    const [updatedDates, setUpdatedDates] = useState([]);
    const [pickerMonth, setPickerMonth] = useState(dayjs());
    const [targetModalVisible, setTargetModalVisible] = useState(false);

    // 当月の更新済み日付を取得する
    useEffect(() => {
        const fetchUpdatedDates = async () => {
            try {
                const response = await apiClient.get('/data/updated-dates', {
                    params: {
                        hotel: selectedHotel,
                        month: pickerMonth.format('YYYY-MM')
                    }
                });
                setUpdatedDates(response.data);
            } catch (error) {
                console.error('更新済み日付の取得に失敗しました:', error);
            }
        };

        fetchUpdatedDates();
    }, [selectedHotel, pickerMonth, apiClient]);

    // データ登録処理
    const onFinish = async (values) => {
        setSubmitLoading(true);
        try {
            const formattedValues = {
                ...values,
                date: values.date.format('YYYY-MM-DD'),
                hotel_name: selectedHotel
            };
            await apiClient.post('/data/reports', formattedValues);
            message.success('データが正常に登録されました。');
            form.resetFields();
            form.setFieldsValue({ date: dayjs() });
            
            // データ更新後にコールバックを呼び出す
            if (onDataUpdated) {
                onDataUpdated();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'データの登録に失敗しました。';
            message.error(errorMessage);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Excelエクスポート処理（年次）
    const handleExport = async () => {
        if (!exportYear) {
            message.warning('エクスポートする年を選択してください。');
            return;
        }
        setExportLoading(true);
        try {
            const response = await apiClient.get('/data/export', {
                params: {
                    hotel: selectedHotel,
                    year: exportYear.format('YYYY')
                },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fileName = `年次レポート_${selectedHotel}_${exportYear.format('YYYY')}.xlsx`;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            if (error.response && error.response.data instanceof Blob && error.response.data.type === 'application/json') {
                const reader = new FileReader();
                reader.onload = function() {
                    const errorData = JSON.parse(this.result);
                    message.error(errorData.message || 'Excelファイルのエクスポートに失敗しました。');
                };
                reader.readAsText(error.response.data);
            } else {
                message.error('Excelファイルのエクスポートに失敗しました。');
            }
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <Card>
            <Title level={4}>データ管理パネル</Title>
            <Divider />
            {/* データ登録フォーム */}
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ date: dayjs() }}
            >
                <Form.Item name="date" label="日付" rules={[{ required: true, message: '日付を選択してください' }]}>
                    <DatePicker 
                        style={{ width: '100%' }} 
                        onPanelChange={(date) => setPickerMonth(date)}
                        cellRender={(current) => {
                            const dateString = current.format('YYYY-MM-DD');
                            if (updatedDates.includes(dateString)) {
                                return (
                                    <div className="ant-picker-cell-inner" style={{ backgroundColor: '#e6f7ff', borderRadius: '2px' }}>
                                        {current.date()}
                                    </div>
                                );
                            }
                            return <div className="ant-picker-cell-inner">{current.date()}</div>;
                        }}
                    />
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
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={submitLoading} block>
                        データ登録
                    </Button>
                </Form.Item>
            </Form>

            <Divider />

            {/* 月次売上目標設定 */}
            <Title level={5} style={{ marginTop: '24px' }}>月次売上目標設定</Title>
            <Button 
                icon={<SettingOutlined />}
                onClick={() => setTargetModalVisible(true)}
                block
                style={{ marginBottom: '24px' }}
            >
                月売上目標を設定
            </Button>

            <Divider />

            {/* Excelエクスポートフォーム */}
            <Title level={5} style={{ marginTop: '24px' }}>年次レポートのエクスポート</Title>
            <Form layout="vertical">
                <Form.Item label="対象年">
                    <DatePicker 
                        picker="year"
                        value={exportYear}
                        onChange={setExportYear}
                        style={{ width: '100%' }}
                        allowClear={false}
                    />
                </Form.Item>
                <Form.Item>
                    <Button 
                        type="default" 
                        onClick={handleExport}
                        loading={exportLoading} 
                        block
                    >
                        Excelエクスポート
                    </Button>
                </Form.Item>
            </Form>

            {/* 月次売上目標設定モーダル */}
            <MonthlyTargetModal
                visible={targetModalVisible}
                onClose={() => setTargetModalVisible(false)}
                selectedHotel={selectedHotel}
                onTargetUpdated={onDataUpdated}
            />
        </Card>
    );
};

export default AdminPanel;
