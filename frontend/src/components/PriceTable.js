// ==================================================================
// 料金表コンポーネント
// Price Table Component
// ==================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table, Button, Modal, Form, Input, InputNumber, Select, Space,
    Typography, Tag, Tooltip, Popconfirm, message, Spin, Empty,
    Timeline, Row, Col, Card, Switch
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined,
    ExportOutlined, SearchOutlined, InfoCircleOutlined,
    TableOutlined, StarOutlined, StarFilled
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import styles from './PriceTable.module.css';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;
const { Option } = Select;

// ==================================================================
// デフォルト料金プランの定義
// ==================================================================
const DEFAULT_PRICE_PLANS = [
    { plan_name: '祝前日', discount_rate: 0, plan_type: 'base', display_order: 0 },
    { plan_name: '特別1.1', discount_rate: 10, plan_type: 'premium', display_order: 1 },
    { plan_name: '特別1.2', discount_rate: 20, plan_type: 'premium', display_order: 2 },
    { plan_name: '特別1.3', discount_rate: 30, plan_type: 'premium', display_order: 3 },
    { plan_name: '特別1.4', discount_rate: 40, plan_type: 'premium', display_order: 4 },
    { plan_name: '特別1.5', discount_rate: 50, plan_type: 'premium', display_order: 5 },
    { plan_name: '特別1.6', discount_rate: 60, plan_type: 'premium', display_order: 6 },
    { plan_name: '特別1.7', discount_rate: 70, plan_type: 'premium', display_order: 7 },
    { plan_name: '特別1.8', discount_rate: 80, plan_type: 'premium', display_order: 8 },
    { plan_name: '特別1.9', discount_rate: 90, plan_type: 'premium', display_order: 9 },
    { plan_name: '特別2.1', discount_rate: 110, plan_type: 'premium', display_order: 10 },
    { plan_name: '特別2.2', discount_rate: 120, plan_type: 'premium', display_order: 11 },
    { plan_name: '特別2.3', discount_rate: 130, plan_type: 'premium', display_order: 12 },
    { plan_name: '特別2.4', discount_rate: 140, plan_type: 'premium', display_order: 13 },
    { plan_name: '特別2.5', discount_rate: 150, plan_type: 'premium', display_order: 14 },
    { plan_name: '特別2.6', discount_rate: 160, plan_type: 'premium', display_order: 15 },
    { plan_name: '特別2.7', discount_rate: 170, plan_type: 'premium', display_order: 16 },
    { plan_name: '10%OFF', discount_rate: -10, plan_type: 'discount', display_order: 17 },
    { plan_name: '15%OFF', discount_rate: -15, plan_type: 'discount', display_order: 18 },
    { plan_name: '20%OFF', discount_rate: -20, plan_type: 'discount', display_order: 19 },
    { plan_name: '25%OFF', discount_rate: -25, plan_type: 'discount', display_order: 20 },
    { plan_name: '30%OFF', discount_rate: -30, plan_type: 'discount', display_order: 21 },
    { plan_name: '35%OFF', discount_rate: -35, plan_type: 'discount', display_order: 22 },
    { plan_name: '40%OFF', discount_rate: -40, plan_type: 'discount', display_order: 23 },
];

// ==================================================================
// デフォルト部屋タイプ（ホテル新今宮）
// ==================================================================
const DEFAULT_ROOM_TYPES_SHIN = [
    { room_type: 'カプセルシングル', category: 'capsule', base_price: 3000 },
    { room_type: 'カプセルツイン', category: 'capsule', base_price: 4450 },
    { room_type: 'Rシングル', category: 'standard', base_price: 5880 },
    { room_type: 'セミダブル', category: 'standard', base_price: 6980 },
    { room_type: 'Rエコノミーシングル', category: 'standard', base_price: 4410 },
    { room_type: 'セミダブル トイレのみ', category: 'standard', base_price: 5510 },
    { room_type: 'Rツイン', category: 'standard', base_price: 8890 },
    { room_type: 'Rダブル', category: 'standard', base_price: 8000 },
    { room_type: '和室シングル', category: 'japanese', base_price: 5140 },
    { room_type: '和室ツイン', category: 'japanese', base_price: 7350 },
    { room_type: '和室トリプル', category: 'japanese', base_price: 12600 },
];

// ==================================================================
// デフォルト部屋タイプ（ホテル動物園前）
// ==================================================================
const DEFAULT_ROOM_TYPES_ZOO = [
    { room_type: 'シングル', category: 'standard', base_price: 5000 },
    { room_type: 'ダブル', category: 'standard', base_price: 7000 },
    { room_type: 'ツイン', category: 'standard', base_price: 8000 },
];

// カテゴリ色定義
const CATEGORY_COLORS = {
    capsule: { bg: '#e6f4ff', label: 'カプセル', color: '#1677ff' },
    standard: { bg: '#ffffff', label: 'スタンダード', color: '#595959' },
    japanese: { bg: '#fffbe6', label: '和室', color: '#d48806' },
};

// 価格計算関数
const calcPrice = (basePrice, discountRate) => Math.round(basePrice * (1 + discountRate / 100));

// ==================================================================
// メインコンポーネント
// ==================================================================
const PriceTable = ({ selectedHotel }) => {
    const { apiClient, user } = useAuth();
    const [priceTables, setPriceTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('priceTableFavorites') || '[]'); }
        catch { return []; }
    });
    const [showTaxIncluded, setShowTaxIncluded] = useState(false);
    const [formPlans] = useState(DEFAULT_PRICE_PLANS);
    const [formRooms, setFormRooms] = useState(
        selectedHotel === 'ホテル新今宮' ? DEFAULT_ROOM_TYPES_SHIN : DEFAULT_ROOM_TYPES_ZOO
    );
    const [form] = Form.useForm();

    const yearOptions = useMemo(() => {
        const current = new Date().getFullYear();
        return [current - 1, current, current + 1, current + 2].map(y => ({ value: String(y), label: `${y}年` }));
    }, []);

    const monthOptions = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            value: String(i + 1).padStart(2, '0'),
            label: `${i + 1}月`
        })), []);

    const fetchPriceTables = useCallback(async () => {
        if (!apiClient || !user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ hotel: selectedHotel });
            if (filterYear) params.append('year', filterYear);
            if (filterMonth) params.append('month', filterMonth);
            const res = await apiClient.get(`/price-tables?${params}`);
            setPriceTables(res.data);
        } catch (err) {
            if (err.response?.status !== 403 && err.response?.status !== 401) {
                message.error('料金表の取得に失敗しました。');
            }
        } finally {
            setLoading(false);
        }
    }, [apiClient, user, selectedHotel, filterYear, filterMonth]);

    useEffect(() => {
        fetchPriceTables();
    }, [fetchPriceTables]);

    useEffect(() => {
        setFormRooms(selectedHotel === 'ホテル新今宮' ? DEFAULT_ROOM_TYPES_SHIN : DEFAULT_ROOM_TYPES_ZOO);
    }, [selectedHotel]);

    const toggleFavorite = (id) => {
        const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
        setFavorites(newFavs);
        localStorage.setItem('priceTableFavorites', JSON.stringify(newFavs));
    };

    const openCreateModal = () => {
        setEditingTable(null);
        setFormRooms(selectedHotel === 'ホテル新今宮' ? DEFAULT_ROOM_TYPES_SHIN : DEFAULT_ROOM_TYPES_ZOO);
        form.resetFields();
        const now = new Date();
        form.setFieldsValue({
            year: String(now.getFullYear()),
            month: String(now.getMonth() + 1).padStart(2, '0'),
            tax_type: 'tax_excluded',
            tax_rate: 10,
        });
        setModalVisible(true);
    };

    const openEditModal = async (tableId) => {
        try {
            const res = await apiClient.get(`/price-tables/${tableId}`);
            const tbl = res.data;
            setEditingTable(tbl);
            setFormRooms(tbl.room_types.map(r => ({
                room_type: r.room_type, category: r.category, base_price: r.base_price,
            })));
            form.setFieldsValue({
                year: tbl.year, month: tbl.month,
                tax_type: tbl.tax_type, tax_rate: tbl.tax_rate, notes: tbl.notes,
            });
            setModalVisible(true);
        } catch {
            message.error('料金表の取得に失敗しました。');
        }
    };

    const showHistory = async (tableId) => {
        try {
            const res = await apiClient.get(`/price-tables/${tableId}/history`);
            setHistoryData(res.data);
            setHistoryModalVisible(true);
        } catch {
            message.error('変更履歴の取得に失敗しました。');
        }
    };

    const handleDelete = async (tableId) => {
        try {
            await apiClient.delete(`/price-tables/${tableId}`);
            message.success('料金表を削除しました。');
            fetchPriceTables();
        } catch (err) {
            message.error(err.response?.data?.message || '削除に失敗しました。');
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const payload = {
                hotel_name: selectedHotel,
                year: values.year,
                month: values.month,
                tax_type: values.tax_type,
                tax_rate: values.tax_rate,
                room_types: formRooms,
                price_plans: formPlans,
                notes: values.notes || '',
                memo: values.memo || '',
            };
            if (editingTable) {
                await apiClient.put(`/price-tables/${editingTable.id}`, payload);
                message.success('料金表を更新しました。');
            } else {
                await apiClient.post('/price-tables', payload);
                message.success('料金表を作成しました。');
            }
            setModalVisible(false);
            fetchPriceTables();
        } catch (err) {
            if (err.errorFields) return;
            message.error(err.response?.data?.message || '保存に失敗しました。');
        }
    };

    const handleExport = (table, format = 'xlsx') => {
        const taxRate = table.tax_rate || 10;
        const applyTax = (p) => showTaxIncluded ? Math.round(p * (1 + taxRate / 100)) : p;
        const headers = ['部屋タイプ', 'カテゴリ', '基準価格', ...table.price_plans.map(p => p.plan_name)];
        const rows = table.room_types.map(room => [
            room.room_type,
            CATEGORY_COLORS[room.category]?.label || room.category,
            applyTax(room.base_price),
            ...table.price_plans.map(plan => applyTax(calcPrice(room.base_price, plan.discount_rate)))
        ]);
        const taxLabel = table.tax_type === 'tax_included' ? '税込' : '税抜';
        const sheetData = [
            [`${table.hotel_name} 料金表 ${table.year}年${table.month}月（${taxLabel}）`],
            [],
            headers,
            ...rows
        ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '料金表');
        const fileName = `料金表_${table.hotel_name}_${table.year}${table.month}.${format}`;
        XLSX.writeFile(wb, fileName);
        message.success(`${fileName} をエクスポートしました。`);
    };

    const filteredTables = useMemo(() => {
        if (!searchText) return priceTables;
        return priceTables.filter(t =>
            t.hotel_name.includes(searchText) ||
            t.year.includes(searchText) ||
            t.month.includes(searchText) ||
            t.room_types?.some(r => r.room_type.includes(searchText))
        );
    }, [priceTables, searchText]);

    const isAdmin = user?.role === 'admin';

    const buildTableColumns = (priceTable) => {
        const taxRate = priceTable.tax_rate || 10;
        const applyTax = (price) => showTaxIncluded ? Math.round(price * (1 + taxRate / 100)) : price;

        return [
            {
                title: '部屋タイプ',
                dataIndex: 'room_type',
                key: 'room_type',
                fixed: 'left',
                width: 175,
                render: (text, record) => (
                    <div className={styles.roomTypeName}>
                        {text}
                        <Tag className={styles.categoryTag} color={CATEGORY_COLORS[record.category]?.color} style={{ fontSize: 10 }}>
                            {CATEGORY_COLORS[record.category]?.label || record.category}
                        </Tag>
                    </div>
                ),
                onCell: (record) => ({ style: { background: CATEGORY_COLORS[record.category]?.bg || '#fff' } })
            },
            {
                title: <span>基準価格<br /><span style={{ fontSize: 10, color: '#aaa' }}>(祝前日)</span></span>,
                dataIndex: 'base_price',
                key: 'base_price',
                width: 90,
                align: 'right',
                render: (val) => <span className={styles.priceBase}>¥{applyTax(val).toLocaleString()}</span>,
                onCell: (record) => ({ style: { background: CATEGORY_COLORS[record.category]?.bg || '#fff' } })
            },
            ...priceTable.price_plans.map(plan => ({
                title: (
                    <span style={{ fontSize: 12 }}>
                        {plan.plan_name}<br />
                        <span style={{ fontSize: 10, color: plan.discount_rate > 0 ? '#f5222d' : plan.discount_rate < 0 ? '#52c41a' : '#1890ff' }}>
                            {plan.discount_rate > 0 ? `+${plan.discount_rate}%` : plan.discount_rate < 0 ? `${plan.discount_rate}%` : '基準'}
                        </span>
                    </span>
                ),
                key: plan.plan_name,
                width: 80,
                align: 'right',
                render: (_, record) => {
                    const price = calcPrice(record.base_price, plan.discount_rate);
                    return (
                        <span className={plan.plan_type === 'base' ? styles.priceBase : plan.plan_type === 'premium' ? styles.pricePremium : styles.priceDiscount}>
                            ¥{applyTax(price).toLocaleString()}
                        </span>
                    );
                },
                onCell: (record) => ({ style: { background: CATEGORY_COLORS[record.category]?.bg || '#fff' } })
            }))
        ];
    };

    const favoriteTables = priceTables.filter(t => favorites.includes(t.id));

    return (
        <div className={styles.priceTableContainer}>
            {/* ヘッダー */}
            <div className={styles.pageHeader}>
                <Title level={4} className={styles.pageTitle}>
                    <TableOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    {selectedHotel} 料金表管理
                </Title>
                {isAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        新規料金表作成
                    </Button>
                )}
            </div>

            {/* フィルターエリア */}
            <div className={styles.filterArea}>
                <Input
                    placeholder="部屋タイプ・年月で検索..."
                    prefix={<SearchOutlined />}
                    className={styles.searchBar}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
                <Select placeholder="年で絞り込み" allowClear style={{ width: 110 }}
                    value={filterYear || undefined} onChange={v => setFilterYear(v || '')} options={yearOptions} />
                <Select placeholder="月で絞り込み" allowClear style={{ width: 100 }}
                    value={filterMonth || undefined} onChange={v => setFilterMonth(v || '')} options={monthOptions} />
                <Space>
                    <Text style={{ fontSize: 12 }}>税込表示</Text>
                    <Switch size="small" checked={showTaxIncluded} onChange={setShowTaxIncluded} />
                    <span className={styles.taxBadge}>{showTaxIncluded ? '税込（10%）' : '税抜'}</span>
                </Space>
            </div>

            {/* 収藏リスト */}
            {favoriteTables.length > 0 && (
                <Card size="small" title={<><StarFilled style={{ color: '#faad14', marginRight: 6 }} />収藏済み</>}
                    style={{ marginBottom: 16, borderColor: '#ffe58f', background: '#fffbe6' }}>
                    <Space wrap>
                        {favoriteTables.map(t => (
                            <Tag key={t.id} color="gold" style={{ cursor: 'pointer' }}>
                                {t.hotel_name} {t.year}年{t.month}月
                            </Tag>
                        ))}
                    </Space>
                </Card>
            )}

            {/* 価格表一覧 */}
            <Spin spinning={loading}>
                {filteredTables.length === 0 && !loading ? (
                    <Empty description={
                        <span>料金表がまだありません。{isAdmin && <Button type="link" onClick={openCreateModal}>新規作成する</Button>}</span>
                    } />
                ) : (
                    filteredTables.map(table => (
                        <Card key={table.id} className={styles.priceTableCard} size="small"
                            title={
                                <div className={styles.cardHeader}>
                                    <Space>
                                        <span className={styles.starIcon} onClick={() => toggleFavorite(table.id)}>
                                            {favorites.includes(table.id)
                                                ? <StarFilled style={{ color: '#faad14' }} />
                                                : <StarOutlined style={{ color: '#ccc' }} />}
                                        </span>
                                        <span className={styles.cardTitle}>{table.hotel_name}　{table.year}年{table.month}月</span>
                                        <Tag color={table.tax_type === 'tax_included' ? 'blue' : 'default'}>
                                            {table.tax_type === 'tax_included' ? `税込 ${table.tax_rate}%` : '税抜'}
                                        </Tag>
                                    </Space>
                                    <div className={styles.cardMeta}>
                                        作成者: {table.created_by}　|　{new Date(table.created_at).toLocaleDateString('ja-JP')}
                                    </div>
                                </div>
                            }
                            extra={
                                <div className={styles.actionArea}>
                                    <Tooltip title="Excel出力">
                                        <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(table, 'xlsx')}>Excel</Button>
                                    </Tooltip>
                                    <Tooltip title="CSV出力">
                                        <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(table, 'csv')}>CSV</Button>
                                    </Tooltip>
                                    {isAdmin && (
                                        <>
                                            <Tooltip title="変更履歴">
                                                <Button size="small" icon={<HistoryOutlined />} onClick={() => showHistory(table.id)} />
                                            </Tooltip>
                                            <Tooltip title="編集">
                                                <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => openEditModal(table.id)} />
                                            </Tooltip>
                                            <Popconfirm title="この料金表を削除しますか？" onConfirm={() => handleDelete(table.id)}
                                                okText="削除" cancelText="キャンセル" okButtonProps={{ danger: true }}>
                                                <Tooltip title="削除">
                                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                                </Tooltip>
                                            </Popconfirm>
                                        </>
                                    )}
                                </div>
                            }
                        >
                            {table.notes && (
                                <div className={styles.priceLegend}>
                                    <InfoCircleOutlined style={{ marginRight: 6 }} />{table.notes}
                                </div>
                            )}
                            <div className={styles.priceLegend} style={{ marginBottom: 12 }}>
                                <Space wrap size="small">
                                    <span><Tag color="blue">基準価格</Tag>祝前日・通常価格</span>
                                    <span><Tag color="red">特別</Tag>旺季割増（%UP）</span>
                                    <span><Tag color="green">%OFF</Tag>割引価格（淡季）</span>
                                    <span style={{ color: '#8c8c8c' }}>{showTaxIncluded ? '税込（10%）表示' : '税抜表示'}</span>
                                </Space>
                            </div>
                            <div className={styles.tableScrollWrapper}>
                                <Table size="small" dataSource={table.room_types} columns={buildTableColumns(table)}
                                    pagination={false} rowKey="room_type" scroll={{ x: 'max-content' }} bordered />
                            </div>
                        </Card>
                    ))
                )}
            </Spin>

            {/* 新規作成/編集モーダル */}
            <Modal title={editingTable ? '料金表を編集' : '新規料金表を作成'} open={modalVisible}
                onOk={handleSubmit} onCancel={() => setModalVisible(false)}
                width={800} okText={editingTable ? '更新' : '作成'} cancelText="キャンセル" style={{ top: 20 }}>
                <Form form={form} layout="vertical">
                    {/* 基本情報 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>📅 基本情報</div>
                        <Row gutter={16}>
                            <Col xs={12} sm={6}>
                                <Form.Item name="year" label="年" rules={[{ required: true, message: '年を選択してください' }]}>
                                    <Select options={yearOptions} placeholder="年" />
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Form.Item name="month" label="月" rules={[{ required: true, message: '月を選択してください' }]}>
                                    <Select options={monthOptions} placeholder="月" />
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Form.Item name="tax_type" label="税種別">
                                    <Select>
                                        <Option value="tax_excluded">税抜</Option>
                                        <Option value="tax_included">税込</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={12} sm={6}>
                                <Form.Item name="tax_rate" label="消費税率(%)">
                                    <InputNumber min={0} max={30} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="notes" label="メモ・備考">
                            <Input.TextArea rows={2} placeholder="備考を入力（任意）" />
                        </Form.Item>
                        {editingTable && (
                            <Form.Item name="memo" label="変更メモ">
                                <Input placeholder="変更内容のメモ（履歴に記録されます）" />
                            </Form.Item>
                        )}
                    </div>

                    {/* 部屋タイプ・基準価格 */}
                    <div className={styles.formSection}>
                        <div className={styles.formSectionTitle}>🏨 部屋タイプと基準価格（税抜）</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#fafafa' }}>
                                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', minWidth: 160 }}>部屋タイプ</th>
                                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #f0f0f0', width: 110 }}>カテゴリ</th>
                                        <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #f0f0f0', width: 140 }}>基準価格（税抜）</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formRooms.map((room, index) => (
                                        <tr key={index} style={{ background: CATEGORY_COLORS[room.category]?.bg || '#fff' }}>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                                                <Input value={room.room_type} size="small"
                                                    onChange={e => {
                                                        const updated = [...formRooms];
                                                        updated[index] = { ...updated[index], room_type: e.target.value };
                                                        setFormRooms(updated);
                                                    }} />
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                                                <Select value={room.category} size="small" style={{ width: '100%' }}
                                                    onChange={v => {
                                                        const updated = [...formRooms];
                                                        updated[index] = { ...updated[index], category: v };
                                                        setFormRooms(updated);
                                                    }}>
                                                    <Option value="capsule">カプセル</Option>
                                                    <Option value="standard">スタンダード</Option>
                                                    <Option value="japanese">和室</Option>
                                                </Select>
                                            </td>
                                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>
                                                <InputNumber value={room.base_price} min={0} prefix="¥" size="small"
                                                    style={{ width: '100%' }}
                                                    onChange={v => {
                                                        const updated = [...formRooms];
                                                        updated[index] = { ...updated[index], base_price: v };
                                                        setFormRooms(updated);
                                                    }}
                                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 価格プレビュー */}
                    <div>
                        <div className={styles.formSectionTitle}>👁️ 価格プレビュー（自動計算）</div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ padding: '6px', textAlign: 'left', borderBottom: '1px solid #eee', minWidth: 140 }}>部屋タイプ</th>
                                        <th style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #eee', width: 80, color: '#1890ff' }}>祝前日</th>
                                        {formPlans.filter(p => p.plan_type === 'premium').slice(0, 5).map(p => (
                                            <th key={p.plan_name} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #eee', width: 75, color: '#f5222d' }}>{p.plan_name}</th>
                                        ))}
                                        {formPlans.filter(p => p.plan_type === 'discount').slice(0, 4).map(p => (
                                            <th key={p.plan_name} style={{ padding: '6px', textAlign: 'right', borderBottom: '1px solid #eee', width: 75, color: '#52c41a' }}>{p.plan_name}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {formRooms.map((room, idx) => (
                                        <tr key={idx} style={{ background: CATEGORY_COLORS[room.category]?.bg || '#fff' }}>
                                            <td style={{ padding: '4px 6px', borderBottom: '1px solid #f5f5f5', fontWeight: 600 }}>{room.room_type}</td>
                                            <td style={{ padding: '4px 6px', borderBottom: '1px solid #f5f5f5', textAlign: 'right', color: '#1890ff', fontWeight: 700 }}>
                                                ¥{(room.base_price || 0).toLocaleString()}
                                            </td>
                                            {formPlans.filter(p => p.plan_type === 'premium').slice(0, 5).map(p => (
                                                <td key={p.plan_name} style={{ padding: '4px 6px', borderBottom: '1px solid #f5f5f5', textAlign: 'right', color: '#f5222d' }}>
                                                    ¥{calcPrice(room.base_price || 0, p.discount_rate).toLocaleString()}
                                                </td>
                                            ))}
                                            {formPlans.filter(p => p.plan_type === 'discount').slice(0, 4).map(p => (
                                                <td key={p.plan_name} style={{ padding: '4px 6px', borderBottom: '1px solid #f5f5f5', textAlign: 'right', color: '#52c41a' }}>
                                                    ¥{calcPrice(room.base_price || 0, p.discount_rate).toLocaleString()}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            ※ 全プランのプレビューは一部省略。保存後に完全な価格表が表示されます。
                        </Text>
                    </div>
                </Form>
            </Modal>

            {/* 変更履歴モーダル */}
            <Modal title={<><HistoryOutlined style={{ marginRight: 8 }} />変更履歴</>}
                open={historyModalVisible} onCancel={() => setHistoryModalVisible(false)}
                footer={<Button onClick={() => setHistoryModalVisible(false)}>閉じる</Button>} width={600}>
                {historyData.length === 0 ? (
                    <div className={styles.emptyHistory}>履歴がありません</div>
                ) : (
                    <Timeline className={styles.historyTimeline}
                        items={historyData.map(h => ({
                            color: h.action === 'created' ? 'green' : h.action === 'deleted' ? 'red' : 'blue',
                            children: (
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        <Tag color={h.action === 'created' ? 'green' : h.action === 'deleted' ? 'red' : 'blue'}>
                                            {h.action === 'created' ? '作成' : h.action === 'deleted' ? '削除' : '更新'}
                                        </Tag>
                                        {h.changed_by}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{new Date(h.changed_at).toLocaleString('ja-JP')}</div>
                                    {h.memo && <div style={{ fontSize: 13, marginTop: 4, color: '#595959' }}>{h.memo}</div>}
                                </div>
                            )
                        }))}
                    />
                )}
            </Modal>
        </div>
    );
};

export default PriceTable;
