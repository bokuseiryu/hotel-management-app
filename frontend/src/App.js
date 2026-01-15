// ==================================================================
// アプリケーションのルートコンポーネント
// Root component of the application
// ==================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { ConfigProvider } from 'antd';
import jaJP from 'antd/locale/ja_JP';

// ==================================================================
// プライベートルート：認証が必要なルートを保護
// Private Route: Protects routes that require authentication
// ==================================================================
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        // 認証状態の読み込み中は何も表示しないか、ローディングスピナーを表示
        return <div>読み込み中...</div>; 
    }
    return user ? children : <Navigate to="/login" />;
};

// ==================================================================
// メインアプリケーションコンポーネント
// Main Application Component
// ==================================================================
function App() {
    return (
        <ConfigProvider locale={jaJP}>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route 
                            path="/dashboard"
                            element={
                                <PrivateRoute>
                                    <DashboardPage />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
