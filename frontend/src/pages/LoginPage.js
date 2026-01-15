// ==================================================================
// ログインページコンポーネント
// Login Page Component
// ==================================================================

import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import styles from './LoginPage.module.css';

const { Title } = Typography;

const LoginPage = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user } = useAuth();

    // ユーザーが既にログインしている場合はダッシュボードにリダイレクト
    // Redirect to dashboard if user is already logged in
    if (user) {
        return <Navigate to="/dashboard" />;
    }

    const onFinish = async (values) => {
        setLoading(true);
        setError('');
        try {
            await login(values.username, values.password);
            navigate('/dashboard');
        } catch (err) {
            const message = err.response?.data?.message || 'ログインに失敗しました。後ほど再試行してください。';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginContainer}>
            <Card className={styles.loginCard}>
                <div className={styles.loginHeader}>
                    <Title level={2}>ホテル運営データ管理</Title>
                    <p>アカウント情報を入力してください</p>
                </div>
                <Form
                    name="login_form"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'アカウント名を入力してください' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="アカウント名" size="large" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'パスワードを入力してください' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="パスワード" size="large" />
                    </Form.Item>

                    {error && <Alert message={error} type="error" showIcon className={styles.errorAlert} />}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className={styles.loginButton} loading={loading} block>
                            サインイン
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
