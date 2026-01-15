// ==================================================================
// ユーザー管理コンポーネント (admin専用)
// User Management Component (Admin only)
// ==================================================================

import React, { useState, useEffect } from 'react';
import { 
    Card, Table, Button, Modal, Form, Input, Select, 
    message, Popconfirm, Typography, Space, Tag 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
    const { apiClient, user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // ユーザーリストを取得
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users');
            setUsers(response.data);
        } catch (error) {
            message.error('ユーザーリストの取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // ユーザー作成/編集モーダルを開く
    const openModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue({
                username: user.username,
                role: user.role
            });
        } else {
            form.resetFields();
        }
        setModalVisible(true);
    };

    // ユーザー作成/編集処理
    const handleSubmit = async (values) => {
        try {
            if (editingUser) {
                await apiClient.put(`/users/${editingUser.id}`, values);
                message.success('ユーザー情報が更新されました。');
            } else {
                await apiClient.post('/users', values);
                message.success('ユーザーが作成されました。');
            }
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || '操作に失敗しました。');
        }
    };

    // ユーザー削除処理
    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/users/${id}`);
            message.success('ユーザーが削除されました。');
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || '削除に失敗しました。');
        }
    };

    // パスワード変更モーダルを開く
    const openPasswordModal = (user) => {
        setEditingUser(user);
        passwordForm.resetFields();
        setPasswordModalVisible(true);
    };

    // パスワード変更処理
    const handlePasswordChange = async (values) => {
        try {
            await apiClient.put(`/users/${editingUser.id}`, { password: values.newPassword });
            message.success('パスワードが変更されました。');
            setPasswordModalVisible(false);
        } catch (error) {
            message.error(error.response?.data?.message || 'パスワードの変更に失敗しました。');
        }
    };

    // 役割のタグカラー
    const getRoleTag = (role) => {
        const colors = {
            admin: 'red',
            manager: 'blue',
            member: 'green'
        };
        const labels = {
            admin: '最高管理者',
            manager: '一般管理者',
            member: '会員'
        };
        return <Tag color={colors[role]}>{labels[role]}</Tag>;
    };

    const columns = [
        {
            title: 'ユーザー名',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: '役割',
            dataIndex: 'role',
            key: 'role',
            render: (role) => getRoleTag(role),
        },
        {
            title: '作成日',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('ja-JP'),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="small">
                    <Button 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => openModal(record)}
                    >
                        編集
                    </Button>
                    <Button 
                        icon={<KeyOutlined />} 
                        size="small"
                        onClick={() => openPasswordModal(record)}
                    >
                        PW変更
                    </Button>
                    {record.username !== 'admin' && (
                        <Popconfirm
                            title="このユーザーを削除しますか？"
                            onConfirm={() => handleDelete(record.id)}
                            okText="削除"
                            cancelText="キャンセル"
                        >
                            <Button 
                                icon={<DeleteOutlined />} 
                                size="small" 
                                danger
                            >
                                削除
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <Card style={{ margin: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>アカウント管理</Title>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => openModal()}
                >
                    新規ユーザー
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={users} 
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            {/* ユーザー作成/編集モーダル */}
            <Modal
                title={editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="username"
                        label="ユーザー名"
                        rules={[{ required: true, message: 'ユーザー名を入力してください' }]}
                    >
                        <Input disabled={editingUser?.username === 'admin'} />
                    </Form.Item>
                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="パスワード"
                            rules={[{ required: true, message: 'パスワードを入力してください' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="role"
                        label="役割"
                        rules={[{ required: true, message: '役割を選択してください' }]}
                    >
                        <Select disabled={editingUser?.username === 'admin'}>
                            <Option value="admin">最高管理者 (admin)</Option>
                            <Option value="manager">一般管理者 (manager)</Option>
                            <Option value="member">会員 (member)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            {editingUser ? '更新' : '作成'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* パスワード変更モーダル */}
            <Modal
                title={`パスワード変更: ${editingUser?.username}`}
                open={passwordModalVisible}
                onCancel={() => setPasswordModalVisible(false)}
                footer={null}
            >
                <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                    <Form.Item
                        name="newPassword"
                        label="新しいパスワード"
                        rules={[
                            { required: true, message: '新しいパスワードを入力してください' },
                            { min: 6, message: 'パスワードは6文字以上にしてください' }
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="パスワード確認"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'パスワードを再入力してください' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('パスワードが一致しません'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            パスワードを変更
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default UserManagement;
