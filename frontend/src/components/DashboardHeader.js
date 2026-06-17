// ==================================================================
// ダッシュボードのヘッダーコンポーネント
// Dashboard Header Component
// ==================================================================

import React from 'react';
import { CalendarDays, Package, Users } from 'lucide-react';
import { Layout, Select, Typography, Space, Dropdown, Avatar, Menu, Button, Tooltip } from 'antd';
import { LogoutOutlined, UserOutlined, SettingOutlined, DashboardOutlined, ReloadOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import styles from './DashboardHeader.module.css';

dayjs.locale('ja');

const { Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// アプリリスト定義
const APP_LINKS = [
    {
        key: 'workshift',
        href: 'https://iestate.co.jp/workshift',
        icon: CalendarDays,
        label: 'シフト管理',
        color: '#1677ff',
        bg: '#e6f4ff',
    },
    {
        key: 'bbt',
        href: 'https://iestate.co.jp/bbt',
        icon: Package,
        label: '在庫管理',
        color: '#52c41a',
        bg: '#f6ffed',
    },
    {
        key: 'meeting',
        href: 'https://iestate.co.jp/meeting',
        icon: Users,
        label: '月次MTG',
        color: '#722ed1',
        bg: '#f9f0ff',
    },
];

const DashboardHeader = ({ user, selectedHotel, onHotelChange, showUserManagement, onToggleUserManagement, onRefresh, refreshLoading }) => {
    const { logout } = useAuth();

    const menuItems = [
        ...(user.role === 'admin' ? [{
            key: 'userManagement',
            icon: showUserManagement ? <DashboardOutlined /> : <SettingOutlined />,
            label: showUserManagement ? 'ダッシュボード' : 'アカウント管理',
            onClick: onToggleUserManagement
        }] : []),
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'サインアウト',
            onClick: logout
        }
    ];

    const menu = <Menu items={menuItems} />;

    return (
        <Header className={styles.header}>
            <div className={styles.headerLeft}>
                <img 
                    src={`${process.env.PUBLIC_URL}/globallinks_logo_ol.png`}
                    alt="㈱グローバルリンクス" 
                    className={styles.companyLogo}
                />
                <div className={styles.headerLeftText}>
                    <Text className={styles.companyName}>㈱グローバルリンクス</Text>
                    <Title level={4} className={styles.dateTitle}>
                        {dayjs().format('YYYY年MM月DD日 (dddd)')}
                    </Title>
                </div>
            </div>
            <div className={styles.headerCenter}>
                <Space size="middle">
                    <Select
                        value={selectedHotel}
                        onChange={onHotelChange}
                        className={styles.hotelSelector}
                        size="large"
                    >
                        <Option value="ホテル新今宮">ホテル新今宮</Option>
                        <Option value="ホテル動物園前">ホテル動物園前</Option>
                    </Select>
                    <Tooltip title="データを更新">
                        <Button 
                            type="primary"
                            icon={<ReloadOutlined spin={refreshLoading} />}
                            onClick={onRefresh}
                            loading={refreshLoading}
                        >
                            更新
                        </Button>
                    </Tooltip>
                </Space>
            </div>
            <div className={styles.headerRight}>
                <Space size="middle">
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <div className={styles.appLauncher}>
                                <div className={styles.appLauncherTitle}>アプリ一覧</div>
                                <div className={styles.appGrid}>
                                    {APP_LINKS.map(app => (
                                        <a
                                            key={app.key}
                                            href={app.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.appItem}
                                            style={{ '--app-color': app.color, '--app-bg': app.bg }}
                                        >
                                            <app.icon size={20} style={{ color: app.color }} className={styles.appEmoji} />
                                            <span className={styles.appLabel}>{app.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        }
                    >
                        <Tooltip title="他のアプリを開く">
                            <Button
                                icon={<AppstoreOutlined />}
                                className={styles.appLauncherBtn}
                                shape="circle"
                                size="large"
                            />
                        </Tooltip>
                    </Dropdown>
                    <Dropdown overlay={menu} trigger={['click']}>
                        <Space className={styles.userProfile} style={{ cursor: 'pointer' }}>
                            <Avatar icon={<UserOutlined />} />
                            <Text>{user.username}</Text>
                        </Space>
                    </Dropdown>
                </Space>
            </div>
        </Header>
    );
};

export default DashboardHeader;
