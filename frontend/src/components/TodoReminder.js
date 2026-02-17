// ==================================================================
// 待办事项提醒组件
// Todo Reminder Component
// ==================================================================

import React, { useState, useEffect } from 'react';
import { Alert, Space, Button } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined } from '@ant-design/icons';
import styles from './TodoReminder.module.css';

const TodoReminder = ({ apiClient, selectedHotel, selectedMonth, onOpenAdminPanel }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkTodos = async () => {
            if (!apiClient) return;
            
            setLoading(true);
            const todoList = [];
            
            try {
                // 今日の日付
                const today = new Date().toISOString().slice(0, 10);
                const currentMonth = new Date().toISOString().slice(0, 7);
                
                // 1. 今日のデータが入力されているかチェック
                const reportsRes = await apiClient.get(`/data/reports?hotel=${selectedHotel}&month=${currentMonth}`);
                const reports = reportsRes.data || [];
                const todayReport = reports.find(r => r.date === today);
                
                if (!todayReport) {
                    todoList.push({
                        type: 'warning',
                        message: '今日のデータ未入力',
                        description: `${today} のデータがまだ入力されていません。`,
                        action: 'input'
                    });
                }
                
                // 2. 今月の売上目標が設定されているかチェック
                const targetRes = await apiClient.get(`/targets/current?hotel=${selectedHotel}&month=${currentMonth}`);
                const target = targetRes.data;
                
                if (!target || !target.sales_target || target.sales_target === 0) {
                    todoList.push({
                        type: 'error',
                        message: '今月の売上目標未設定',
                        description: `${currentMonth} の月次売上目標が設定されていません。`,
                        action: 'target'
                    });
                }
                
                // 3. 昨日のデータが入力されているかチェック
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);
                const yesterdayReport = reports.find(r => r.date === yesterdayStr);
                
                if (!yesterdayReport && yesterday.getMonth() === new Date().getMonth()) {
                    todoList.push({
                        type: 'info',
                        message: '昨日のデータ未入力',
                        description: `${yesterdayStr} のデータがまだ入力されていません。`,
                        action: 'input'
                    });
                }
                
            } catch (error) {
                console.error('Todo check error:', error);
            } finally {
                setLoading(false);
                setTodos(todoList);
            }
        };
        
        checkTodos();
    }, [apiClient, selectedHotel, selectedMonth]);

    if (loading || todos.length === 0) {
        return null;
    }

    const getIcon = (type) => {
        switch (type) {
            case 'error': return <ExclamationCircleOutlined />;
            case 'warning': return <ExclamationCircleOutlined />;
            default: return <CheckCircleOutlined />;
        }
    };

    return (
        <div className={styles.todoContainer}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                {todos.map((todo, index) => (
                    <Alert
                        key={index}
                        message={todo.message}
                        description={todo.description}
                        type={todo.type}
                        icon={getIcon(todo.type)}
                        showIcon
                        closable
                        className={styles.todoAlert}
                        action={
                            <Button 
                                size="small" 
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={onOpenAdminPanel}
                            >
                                入力
                            </Button>
                        }
                    />
                ))}
            </Space>
        </div>
    );
};

export default TodoReminder;
