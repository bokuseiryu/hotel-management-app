// ==================================================================
// ダッシュボードページコンポーネント
// Dashboard Page Component
// ==================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';

import DashboardHeader from '../components/DashboardHeader';
import SummaryCards from '../components/SummaryCards';
import TrendsChart from '../components/TrendsChart';
import MonthlyTrendsChart from '../components/MonthlyTrendsChart';
import ReportsList from '../components/ReportsList';
import AdminPanel from '../components/AdminPanel';
import UserManagement from '../components/UserManagement';
import styles from './DashboardPage.module.css';
import dayjs from 'dayjs';

const { Content, Sider } = Layout;

const DashboardPage = () => {
    const { user, apiClient } = useAuth();
    const [selectedHotel, setSelectedHotel] = useState('ホテル新今宮');
    const [summaryData, setSummaryData] = useState({});
    const [trendsData, setTrendsData] = useState([]);
    const [reportsData, setReportsData] = useState([]);
    const [trendsMetric, setTrendsMetric] = useState('projected_revenue'); // 'projected_revenue' or 'occupancy_rate_occ'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [monthlyTrendsData, setMonthlyTrendsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserManagement, setShowUserManagement] = useState(false);

    // データ取得関数
    const fetchData = useCallback(async () => {
        if (!apiClient) return;
        setLoading(true);
        try {
            const [summaryRes, trendsRes, reportsRes, monthlyTrendsRes] = await Promise.all([
                apiClient.get(`/data/summary?hotel=${selectedHotel}`),
                apiClient.get(`/data/trends?hotel=${selectedHotel}&metric=${trendsMetric}`),
                apiClient.get(`/data/reports?hotel=${selectedHotel}&month=${selectedMonth}`),
                apiClient.get(`/data/current-month-daily?hotel=${selectedHotel}`)
            ]);
            setSummaryData(summaryRes.data);
            setTrendsData(trendsRes.data);
            setReportsData(reportsRes.data);
            setMonthlyTrendsData(monthlyTrendsRes.data);
        } catch (error) {
            console.error('データの取得に失敗しました:', error);
            message.error('データの取得に失敗しました。ページを再読み込みしてください。');
        } finally {
            setLoading(false);
        }
    }, [apiClient, selectedHotel, trendsMetric, selectedMonth]);

    // 初期ロードとホテル・メトリック・月の変更時にデータを取得
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    // Socket.IOによるリアルタイム更新
    useEffect(() => {
        const socket = io(); // バックエンドサーバーに接続
        socket.on('data-updated', (updateInfo) => {
            console.log('データ更新通知を受信:', updateInfo);
            message.success('データが更新されました！');
            fetchData(); // データを再取得してUIを更新
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchData]);

    // ユーザーがまだロードされていない場合はローディング表示
    // Show loading if user is not yet loaded
    if (!user) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>読み込み中...</div>;
    }

    return (
        <Layout className={styles.dashboardLayout}>
            <DashboardHeader 
                user={user} 
                selectedHotel={selectedHotel} 
                onHotelChange={setSelectedHotel}
                showUserManagement={showUserManagement}
                onToggleUserManagement={() => setShowUserManagement(!showUserManagement)}
            />
            <Layout>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <Sider width={350} className={styles.sider} breakpoint="lg" collapsedWidth="0">
                        <AdminPanel onDataUpdated={fetchData} selectedHotel={selectedHotel} userRole={user?.role} />
                    </Sider>
                )}
                <Content className={styles.content}>
                    {showUserManagement && user?.role === 'admin' ? (
                        <UserManagement />
                    ) : (
                        <>
                            <SummaryCards data={summaryData} loading={loading} />
                            <TrendsChart 
                                data={trendsData} 
                                metric={trendsMetric} 
                                onMetricChange={setTrendsMetric} 
                                loading={loading} 
                            />
                            <ReportsList 
                                data={reportsData} 
                                month={selectedMonth} 
                                onMonthChange={setSelectedMonth} 
                                loading={loading} 
                                userRole={user?.role}
                            />
                            <MonthlyTrendsChart 
                                data={monthlyTrendsData}
                                loading={loading}
                            />
                        </>
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardPage;
