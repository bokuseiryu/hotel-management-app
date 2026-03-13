// ==================================================================
// ダッシュボードページコンポーネント
// Dashboard Page Component
// ==================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message, Drawer, FloatButton } from 'antd';
import { PlusOutlined, MenuOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';

import DashboardHeader from '../components/DashboardHeader';
import SummaryCards from '../components/SummaryCards';
import AnalysisCards from '../components/AnalysisCards';
import AlertBanner from '../components/AlertBanner';
import TodoReminder from '../components/TodoReminder';
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
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString()); // YYYY
    const [monthlyTrendsData, setMonthlyTrendsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 992);

    // データ取得関数
    const fetchData = useCallback(async () => {
        if (!apiClient) return;
        setLoading(true);
        try {
            const [summaryRes, trendsRes, reportsRes, monthlyTrendsRes] = await Promise.all([
                apiClient.get(`/data/summary?hotel=${selectedHotel}&month=${selectedMonth}`),
                apiClient.get(`/data/trends?hotel=${selectedHotel}&metric=${trendsMetric}&month=${selectedMonth}`),
                apiClient.get(`/data/reports?hotel=${selectedHotel}&month=${selectedMonth}`),
                apiClient.get(`/data/monthly-trends?hotel=${selectedHotel}&year=${selectedYear}`)
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
    }, [apiClient, selectedHotel, trendsMetric, selectedMonth, selectedYear]);

    // 初期ロードとホテル・メトリック・月の変更時にデータを取得
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    // Socket.IOによるリアルタイム更新
    // 本番環境ではRenderのサーバーに接続
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || undefined;
    
    useEffect(() => {
        const socket = io(SOCKET_URL); // バックエンドサーバーに接続
        socket.on('data-updated', (updateInfo) => {
            console.log('データ更新通知を受信:', updateInfo);
            message.success('データが更新されました！');
            fetchData(); // データを再取得してUIを更新
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchData]);

    // ウィンドウサイズ変更の監視
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 992;
            setIsMobile(mobile);
            if (!mobile) {
                setDrawerVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
                onRefresh={fetchData}
                refreshLoading={loading}
            />
            <Layout>
                {(user?.role === 'admin' || user?.role === 'manager') && !isMobile && (
                    <Sider width={350} className={styles.sider} breakpoint="lg" collapsedWidth="0">
                        <AdminPanel onDataUpdated={fetchData} selectedHotel={selectedHotel} userRole={user?.role} />
                    </Sider>
                )}
                <Content className={styles.content}>
                    {showUserManagement && user?.role === 'admin' ? (
                        <UserManagement />
                    ) : (
                        <>
                            <TodoReminder 
                                apiClient={apiClient} 
                                selectedHotel={selectedHotel} 
                                selectedMonth={selectedMonth}
                                onOpenAdminPanel={() => {}}
                            />
                            <AlertBanner data={summaryData} />
                            <SummaryCards data={summaryData} loading={loading} />
                            <AnalysisCards data={summaryData} />
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
                                forecastData={summaryData}
                                year={selectedYear}
                                onYearChange={(date) => setSelectedYear(date ? date.format('YYYY') : new Date().getFullYear().toString())}
                                loading={loading}
                            />
                        </>
                    )}
                </Content>
            </Layout>

            {/* モバイル用抽屉式メニュー */}
            {(user?.role === 'admin' || user?.role === 'manager') && isMobile && (
                <>
                    <Drawer
                        title="データ管理パネル"
                        placement="bottom"
                        onClose={() => setDrawerVisible(false)}
                        open={drawerVisible}
                        height="85vh"
                        className={styles.mobileDrawer}
                    >
                        <AdminPanel onDataUpdated={() => {
                            fetchData();
                            setDrawerVisible(false);
                        }} selectedHotel={selectedHotel} userRole={user?.role} />
                    </Drawer>
                    <FloatButton
                        icon={<PlusOutlined />}
                        type="primary"
                        style={{ right: 24, bottom: 24 }}
                        onClick={() => setDrawerVisible(true)}
                        tooltip="データ登録"
                    />
                </>
            )}
        </Layout>
    );
};

export default DashboardPage;
