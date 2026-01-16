// ==================================================================
// データ移行スクリプト (SQLite -> MongoDB)
// Data Migration Script (SQLite -> MongoDB)
// ==================================================================

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env ファイルをロード
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// モデルをインポート
const User = require('../models/userModel');
const DailyReport = require('../models/dailyReportModel');

// SQLファイルからINSERT文を解析する関数（複数行VALUES対応）
const parseSqlInserts = (sqlContent, tableName) => {
    const results = [];
    
    // 各行の VALUES (...)をマッチ
    const rowRegex = /\('([^']*)',\s*'([^']*)',\s*([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*(\d+),\s*([\d.]+)\)/g;
    
    let match;
    while ((match = rowRegex.exec(sqlContent)) !== null) {
        // match[1] = hotel_name, match[2] = date, etc.
        results.push([
            null,           // id (不要)
            match[1],       // hotel_name
            match[2],       // date
            parseFloat(match[4]),  // projected_revenue
            parseFloat(match[5]),  // occupancy_rate_occ
            parseInt(match[6]),    // cumulative_sales
            parseFloat(match[7]),  // average_daily_rate_adr
            parseFloat(match[3]),  // monthly_sales_target
        ]);
    }
    
    return results;
};

const migrateData = async () => {
    try {
        // MongoDB に直接接続
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDBに接続しました。');

        // 1. 既存のデータをクリア
        console.log('既存のデータをクリアしています...');
        await User.deleteMany({});
        await DailyReport.deleteMany({});
        console.log('データクリア完了。');

        // 2. デフォルトユーザーを作成
        console.log('デフォルトユーザーを作成中...');
        const users = [
            { username: 'admin', password: 'hotel123', role: 'admin' },
            { username: 'manager01', password: 'user123', role: 'manager' },
            { username: 'staff01', password: 'user123', role: 'member' },
        ];
        await User.insertMany(users);
        console.log('デフォルトユーザー作成完了。');

        // 3. SQLファイルから日報データを移行
        console.log('日報データを移行中...');
        const sqlFilePath = path.join(__dirname, '..', 'sql', 'init.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        const reportValues = parseSqlInserts(sqlContent, 'daily_reports');

        const reports = reportValues.map(row => ({
            hotel_name: row[1],
            date: row[2],
            projected_revenue: row[3],
            occupancy_rate_occ: row[4],
            cumulative_sales: row[5],
            average_daily_rate_adr: row[6],
            monthly_sales_target: row[7],
        }));

        if (reports.length > 0) {
            await DailyReport.insertMany(reports, { ordered: false });
            console.log(`${reports.length}件の日報データを移行しました。`);
        } else {
            console.log('移行する日報データが見つかりませんでした。');
        }

        console.log('✅ データ移行が正常に完了しました！');

    } catch (error) {
        console.error('データ移行中にエラーが発生しました:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB接続をクローズしました。');
        process.exit();
    }
};

migrateData();
