// ==================================================================
// ホテル運営データ管理システム バックエンド
// Hotel Management Data System Backend
// ==================================================================

// ライブラリのインポート
// Import libraries
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// 内部モジュールのインポート
// Import internal modules
const dbManager = require('./utils/database');
const authRoutes = require('../routes/auth');
const dataRoutes = require('../routes/data');
const usersRoutes = require('../routes/users');

// データベースインスタンスの取得
// Get database instance
const dbInstance = dbManager.getInstance();
const db = dbInstance.connection;
const { errorHandler } = require('../middleware/errorHandler');

// アプリケーションの初期化
// Initialize application
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // 本番環境では特定のオリジンに制限してください (Restrict to specific origin in production)
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// 定数の設定
// Set constants
const PORT = process.env.PORT || 3009;

// ミドルウェアの設定
// Setup middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供 (フロントエンドのビルドファイル)
// Serve static files (frontend build files)
const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'build');
app.use(express.static(frontendBuildPath));

// APIルートの設定
// Setup API routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/users', usersRoutes);

// すべての未定義APIルートをフロントエンドにリダイレクト
// Redirect all undefined API routes to the frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// グローバルエラーハンドラー
// Global error handler
app.use(errorHandler);

// Socket.IOの接続ハンドリング
// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log('クライアントが接続しました。 A client connected.');

    socket.on('disconnect', () => {
        console.log('クライアントが切断しました。 Client disconnected.');
    });
});

// データベースの変更を監視し、クライアントに通知
// Watch for database changes and notify clients
dbInstance.on('update', (data) => {
    console.log('データベースが更新されました。 Database was updated.');
    io.emit('data-updated', data);
});

// サーバーの起動
// Start the server
server.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。 Server is running on port ${PORT}.`);
});

// データベース接続のクローズ処理
// Handle closing the database connection
process.on('SIGINT', () => {
    dbInstance.close();
    console.log('アプリケーションのシャットダウンにより、データベース接続がクローズされました。');
    process.exit(0);
});

module.exports = { app, server, io };
