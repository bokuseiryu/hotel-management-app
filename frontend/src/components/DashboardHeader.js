// ==================================================================
// ダッシュボードのヘッダーコンポーネント
// Dashboard Header Component
// ==================================================================

import React from 'react';
import { Layout, Select, Typography, Space, Dropdown, Avatar, Menu } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import styles from './DashboardHeader.module.css';

dayjs.locale('ja');

const { Header } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const DashboardHeader = ({ user, selectedHotel, onHotelChange }) => {
    const { logout } = useAuth();

    const menu = (
        <Menu>
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
                サインアウト
            </Menu.Item>
        </Menu>
    );

    return (
        <Header className={styles.header}>
            <div className={styles.headerLeft}>
                <Title level={4} className={styles.dateTitle}>
                    {dayjs().format('YYYY年MM月DD日 (dddd)')}
                </Title>
            </div>
            <div className={styles.headerCenter}>
                <Select
                    value={selectedHotel}
                    onChange={onHotelChange}
                    className={styles.hotelSelector}
                    size="large"
                >
                    <Option value="ホテル新今宮">ホテル新今宮</Option>
                    <Option value="ホテル動物園前">ホテル動物園前</Option>
                </Select>
            </div>
            <div className={styles.headerRight}>
                <Dropdown overlay={menu} trigger={['click']}>
                    <Space className={styles.userProfile} style={{ cursor: 'pointer' }}>
                        <Avatar icon={<UserOutlined />} />
                        <Text>{user.username}</Text>
                    </Space>
                </Dropdown>
            </div>
        </Header>
    );
};

export default DashboardHeader;
