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
    const [selectedYear, setSelectedYear] = useState(dayjs());
    const [monthlyTrendsData, setMonthlyTrendsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // データ取得関数
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, trendsRes, reportsRes, monthlyTrendsRes] = await Promise.all([
                apiClient.get(`/data/summary?hotel=${selectedHotel}`),
                apiClient.get(`/data/trends?hotel=${selectedHotel}&metric=${trendsMetric}`),
                apiClient.get(`/data/reports?hotel=${selectedHotel}&month=${selectedMonth}`),
                apiClient.get(`/data/monthly-trends?hotel=${selectedHotel}&year=${selectedYear.format('YYYY')}`)
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
        fetchData();
    }, [fetchData]);

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

    return (
        <Layout className={styles.dashboardLayout}>
            <DashboardHeader 
                user={user} 
                selectedHotel={selectedHotel} 
                onHotelChange={setSelectedHotel} 
            />
            <Layout>
                {user.role === 'admin' && (
                    <Sider width={350} className={styles.sider} breakpoint="lg" collapsedWidth="0">
                        <AdminPanel onDataUpdated={fetchData} selectedHotel={selectedHotel} />
                    </Sider>
                )}
                <Content className={styles.content}>
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
                        userRole={user.role}
                    />
                    <MonthlyTrendsChart 
                        data={monthlyTrendsData}
                        year={selectedYear}
                        onYearChange={setSelectedYear}
                        loading={loading}
                    />
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardPage;
