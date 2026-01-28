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
const connectDB = require('./utils/database');
const authRoutes = require('../routes/auth');
const dataRoutes = require('../routes/data');
const usersRoutes = require('../routes/users');
const targetsRoutes = require('../routes/targets');
const { errorHandler } = require('../middleware/errorHandler');
const User = require('../models/userModel');

// データベースに接続し、初期データを作成
// Connect to Database and initialize data
const initializeDatabase = async () => {
    await connectDB();
    
    // 既存のユーザーを確認し、パスワードがハッシュ化されていない場合は再作成
    // Check existing users and recreate if passwords are not hashed
    const adminUser = await User.findOne({ username: 'admin' });
    
    // パスワードがハッシュ化されていない場合（$2a$ または $2b$ で始まらない場合）、再作成
    const needsReset = !adminUser || !adminUser.password.startsWith('$2');
    
    if (needsReset) {
        console.log('ユーザーデータを初期化中...');
        
        // 既存のユーザーを削除
        await User.deleteMany({});
        
        // User.create() を使用して pre('save') フックを発動させ、パスワードをハッシュ化
        await User.create({ username: 'admin', password: 'hotel123', role: 'admin' });
        await User.create({ username: 'manager01', password: 'user123', role: 'manager' });
        await User.create({ username: 'staff01', password: 'user123', role: 'member' });
        
        console.log('デフォルトユーザー作成完了（パスワードはハッシュ化済み）。');
    } else {
        const userCount = await User.countDocuments();
        console.log(`既存のユーザー数: ${userCount}（パスワードはハッシュ化済み）`);
    }
    
    // 達成率を再計算（insertManyではpre('save')フックが実行されないため）
    // Recalculate achievement rates (insertMany doesn't trigger pre('save') hook)
    const DailyReport = require('../models/dailyReportModel');
    const reports = await DailyReport.find({});
    
    if (reports.length > 0) {
        console.log('達成率を再計算中...');
        let updatedCount = 0;
        
        for (const report of reports) {
            const newAchievementRate = report.monthly_sales_target > 0 
                ? (report.projected_revenue / report.monthly_sales_target) * 100 
                : 0;
            
            // 達成率が異なる場合のみ更新
            if (report.achievement_rate !== newAchievementRate) {
                await DailyReport.findByIdAndUpdate(report._id, { 
                    achievement_rate: newAchievementRate,
                    updated_at: new Date()
                });
                updatedCount++;
            }
        }
        
        console.log(`${updatedCount}件の達成率を更新しました。`);
    }
};

initializeDatabase();

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
app.use('/api/targets', targetsRoutes);

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


// サーバーの起動
// Start the server
server.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。 Server is running on port ${PORT}.`);
});

// データベース接続のクローズ処理
// Handle closing the database connection
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('アプリケーションのシャットダウンにより、MongoDB接続がクローズされました。');
    process.exit(0);
});

module.exports = { app, server, io };
