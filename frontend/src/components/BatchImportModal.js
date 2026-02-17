// ==================================================================
// 批量导入模态框组件
// Batch Import Modal Component
// ==================================================================

import React, { useState } from 'react';
import { Modal, Upload, Button, Table, message, Alert, Space, Typography } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import styles from './BatchImportModal.module.css';

const { Text } = Typography;

const BatchImportModal = ({ visible, onClose, onImport, selectedHotel }) => {
    const [fileData, setFileData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);

    // Excelテンプレートをダウンロード
    const downloadTemplate = () => {
        const templateData = [
            {
                '日付': '2026-02-01',
                '回収予定額': 500000,
                '稼働率OCC': 75.5,
                '当月累計販売数': 100,
                '平均単価ADR': 5000
            },
            {
                '日付': '2026-02-02',
                '回収予定額': 520000,
                '稼働率OCC': 78.2,
                '当月累計販売数': 210,
                '平均単価ADR': 5100
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'データ入力');
        
        // 列幅を設定
        ws['!cols'] = [
            { wch: 12 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 12 }
        ];

        XLSX.writeFile(wb, `データ入力テンプレート_${selectedHotel}.xlsx`);
        message.success('テンプレートをダウンロードしました');
    };

    // Excelファイルを読み込む
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // データを変換・検証
                const validationErrors = [];
                const processedData = jsonData.map((row, index) => {
                    const rowNum = index + 2; // Excelの行番号（ヘッダー行を除く）
                    
                    // 日付の検証
                    let date = row['日付'];
                    if (!date) {
                        validationErrors.push(`行${rowNum}: 日付が入力されていません`);
                    } else if (typeof date === 'number') {
                        // Excelの日付シリアル値を変換
                        const excelDate = new Date((date - 25569) * 86400 * 1000);
                        date = excelDate.toISOString().slice(0, 10);
                    }

                    // 数値の検証
                    const projectedRevenue = Number(row['回収予定額']) || 0;
                    const occupancyRate = Number(row['稼働率OCC']) || 0;
                    const cumulativeSales = Number(row['当月累計販売数']) || 0;
                    const adr = Number(row['平均単価ADR']) || 0;

                    if (projectedRevenue <= 0) {
                        validationErrors.push(`行${rowNum}: 回収予定額が無効です`);
                    }

                    return {
                        key: index,
                        date: date,
                        projected_revenue: projectedRevenue,
                        occupancy_rate_occ: occupancyRate,
                        cumulative_sales: cumulativeSales,
                        average_daily_rate_adr: adr,
                        hotel_name: selectedHotel
                    };
                });

                setErrors(validationErrors);
                setFileData(processedData);
                
                if (validationErrors.length === 0) {
                    message.success(`${processedData.length}件のデータを読み込みました`);
                } else {
                    message.warning(`${validationErrors.length}件のエラーがあります`);
                }
            } catch (error) {
                message.error('ファイルの読み込みに失敗しました');
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // 自動アップロードを防ぐ
    };

    // データをインポート
    const handleImport = async () => {
        if (fileData.length === 0) {
            message.warning('インポートするデータがありません');
            return;
        }

        if (errors.length > 0) {
            message.error('エラーを修正してから再度お試しください');
            return;
        }

        setLoading(true);
        try {
            await onImport(fileData);
            message.success(`${fileData.length}件のデータをインポートしました`);
            handleClose();
        } catch (error) {
            message.error('インポートに失敗しました: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFileData([]);
        setErrors([]);
        onClose();
    };

    const columns = [
        { title: '日付', dataIndex: 'date', key: 'date', width: 120 },
        { 
            title: '回収予定額', 
            dataIndex: 'projected_revenue', 
            key: 'projected_revenue',
            render: (val) => `¥${val.toLocaleString()}`
        },
        { 
            title: '稼働率OCC', 
            dataIndex: 'occupancy_rate_occ', 
            key: 'occupancy_rate_occ',
            render: (val) => `${val}%`
        },
        { title: '累計販売数', dataIndex: 'cumulative_sales', key: 'cumulative_sales' },
        { 
            title: '平均単価ADR', 
            dataIndex: 'average_daily_rate_adr', 
            key: 'average_daily_rate_adr',
            render: (val) => `¥${val.toLocaleString()}`
        }
    ];

    return (
        <Modal
            title={<><FileExcelOutlined /> バッチデータインポート</>}
            open={visible}
            onCancel={handleClose}
            width={800}
            footer={[
                <Button key="template" icon={<DownloadOutlined />} onClick={downloadTemplate}>
                    テンプレートダウンロード
                </Button>,
                <Button key="cancel" onClick={handleClose}>
                    キャンセル
                </Button>,
                <Button 
                    key="import" 
                    type="primary" 
                    loading={loading}
                    disabled={fileData.length === 0 || errors.length > 0}
                    onClick={handleImport}
                >
                    インポート ({fileData.length}件)
                </Button>
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Alert
                    message="使い方"
                    description={
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                            <li>「テンプレートダウンロード」をクリックしてExcelテンプレートを取得</li>
                            <li>テンプレートにデータを入力して保存</li>
                            <li>下のアップロードエリアにファイルをドラッグ＆ドロップ</li>
                            <li>データを確認して「インポート」をクリック</li>
                        </ol>
                    }
                    type="info"
                    showIcon
                />

                <Upload.Dragger
                    accept=".xlsx,.xls"
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                    className={styles.uploadArea}
                >
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </p>
                    <p className="ant-upload-text">クリックまたはドラッグでExcelファイルをアップロード</p>
                    <p className="ant-upload-hint">.xlsx, .xls ファイルに対応</p>
                </Upload.Dragger>

                {errors.length > 0 && (
                    <Alert
                        message={`${errors.length}件のエラー`}
                        description={
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                {errors.length > 5 && <li>...他 {errors.length - 5}件</li>}
                            </ul>
                        }
                        type="error"
                        showIcon
                    />
                )}

                {fileData.length > 0 && (
                    <>
                        <Text strong>プレビュー ({fileData.length}件)</Text>
                        <Table
                            columns={columns}
                            dataSource={fileData}
                            size="small"
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: 600 }}
                        />
                    </>
                )}
            </Space>
        </Modal>
    );
};

export default BatchImportModal;
