// ==================================================================
// 認証状態を管理するカスタムフック
// Custom hook for managing authentication state
// ==================================================================

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// 認証コンテキストの作成
// Create authentication context
const AuthContext = createContext(null);

// ==================================================================
// 認証プロバイダーコンポーネント
// Auth Provider Component
// ==================================================================
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // APIクライアントの設定
    // Setup API client
    const apiClient = axios.create({
        baseURL: '/api'
    });

    apiClient.interceptors.request.use(config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, error => {
        return Promise.reject(error);
    });

    // 初期ロード時にローカルストレージからユーザー情報を復元
    // Restore user info from localStorage on initial load
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    // ログイン関数
    // Login function
    const login = async (username, password) => {
        const response = await apiClient.post('/auth/login', { username, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setToken(token);
        setUser(user);
        return user;
    };

    // ログアウト関数
    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const authValue = {
        user,
        token,
        loading,
        login,
        logout,
        apiClient
    };

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

// ==================================================================
// 認証フック
// Custom auth hook
// ==================================================================
export const useAuth = () => {
    return useContext(AuthContext);
};
