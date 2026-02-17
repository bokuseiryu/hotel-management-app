// ==================================================================
// 增强的数据导出模态框组件
// Enhanced Export Modal Component
// ==================================================================

import React, { useState } from 'react';
import { Modal, Button, DatePicker, Checkbox, Radio, Space, message, Divider, Typography } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import styles from './ExportModal.module.css';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ExportModal = ({ visible, onClose, apiClient, selectedHotel }) => {
    const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()]);
    const [exportFormat, setExportFormat] = useState('excel');
    const [selectedFields, setSelectedFields] = useState([
        'date', 'projected_revenue', 'occupancy_rate_occ', 
        'cumulative_sales', 'average_daily_rate_adr', 'achievement_rate'
    ]);
    const [loading, setLoading] = useState(false);

    const fieldOptions = [
        { label: '日付', value: 'date' },
        { label: '回収予定額', value: 'projected_revenue' },
        { label: '稼働率OCC', value: 'occupancy_rate_occ' },
        { label: '当月累計販売数', value: 'cumulative_sales' },
        { label: '平均単価ADR', value: 'average_daily_rate_adr' },
        { label: '達成率', value: 'achievement_rate' },
        { label: '月売上目標', value: 'monthly_sales_target' }
    ];

    const fieldLabels = {
        date: '日付',
        projected_revenue: '回収予定額',
        occupancy_rate_occ: '稼働率OCC',
        cumulative_sales: '当月累計販売数',
        average_daily_rate_adr: '平均単価ADR',
        achievement_rate: '達成率',
        monthly_sales_target: '月売上目標'
    };

    // データを取得してエクスポート
    const handleExport = async () => {
        if (!dateRange || dateRange.length !== 2) {
            message.warning('日付範囲を選択してください');
            return;
        }

        if (selectedFields.length === 0) {
            message.warning('少なくとも1つのフィールドを選択してください');
            return;
        }

        setLoading(true);
        try {
            const startDate = dateRange[0].format('YYYY-MM-DD');
            const endDate = dateRange[1].format('YYYY-MM-DD');
            
            // 日付範囲内のデータを取得
            const response = await apiClient.get(`/data/export?hotel=${selectedHotel}&startDate=${startDate}&endDate=${endDate}`);
            const data = response.data || [];

            if (data.length === 0) {
                message.warning('指定された期間にデータがありません');
                setLoading(false);
                return;
            }

            // 選択されたフィールドのみを抽出
            const exportData = data.map(item => {
                const row = {};
                selectedFields.forEach(field => {
                    row[fieldLabels[field]] = item[field];
                });
                return row;
            });

            if (exportFormat === 'excel') {
                exportToExcel(exportData, startDate, endDate);
            } else {
                exportToPDF(exportData, startDate, endDate);
            }

            message.success(`${data.length}件のデータをエクスポートしました`);
            onClose();
        } catch (error) {
            message.error('エクスポートに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Excelエクスポート
    const exportToExcel = (data, startDate, endDate) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'データ');

        // 列幅を自動調整
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length * 2, 12)
        }));
        ws['!cols'] = colWidths;

        const fileName = `${selectedHotel}_${startDate}_${endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // PDFエクスポート（簡易版 - HTMLをPDFとして印刷）
    const exportToPDF = (data, startDate, endDate) => {
        // 新しいウィンドウでPDF用のHTMLを生成
        const printWindow = window.open('', '_blank');
        
        const tableRows = data.map(row => 
            `<tr>${Object.values(row).map(val => `<td style="border:1px solid #ddd;padding:8px;">${val !== null && val !== undefined ? val : '-'}</td>`).join('')}</tr>`
        ).join('');

        const tableHeaders = Object.keys(data[0] || {}).map(key => 
            `<th style="border:1px solid #ddd;padding:8px;background:#f5f5f5;">${key}</th>`
        ).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${selectedHotel} レポート</title>
                <style>
                    body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; padding: 20px; }
                    h1 { color: #1890ff; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    .header { display: flex; justify-content: space-between; align-items: center; }
                    .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 ${selectedHotel} 運営レポート</h1>
                    <p>期間: ${startDate} ～ ${endDate}</p>
                </div>
                <div class="summary">
                    <strong>データ件数:</strong> ${data.length}件
                </div>
                <table>
                    <thead><tr>${tableHeaders}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <p style="margin-top:30px;color:#888;font-size:12px;">
                    出力日時: ${new Date().toLocaleString('ja-JP')}
                </p>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <Modal
            title={<><DownloadOutlined /> データエクスポート</>}
            open={visible}
            onCancel={onClose}
            width={600}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    キャンセル
                </Button>,
                <Button 
                    key="export" 
                    type="primary" 
                    loading={loading}
                    icon={exportFormat === 'excel' ? <FileExcelOutlined /> : <FilePdfOutlined />}
                    onClick={handleExport}
                >
                    エクスポート
                </Button>
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                    <Text strong>日付範囲</Text>
                    <div style={{ marginTop: 8 }}>
                        <RangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                        />
                    </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                    <Text strong>出力形式</Text>
                    <div style={{ marginTop: 8 }}>
                        <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                            <Radio.Button value="excel">
                                <FileExcelOutlined /> Excel (.xlsx)
                            </Radio.Button>
                            <Radio.Button value="pdf">
                                <FilePdfOutlined /> PDF (印刷用)
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div>
                    <Text strong>出力フィールド</Text>
                    <div style={{ marginTop: 8 }}>
                        <Checkbox.Group
                            options={fieldOptions}
                            value={selectedFields}
                            onChange={setSelectedFields}
                        />
                    </div>
                </div>
            </Space>
        </Modal>
    );
};

export default ExportModal;
