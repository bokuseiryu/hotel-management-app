// ==================================================================
// ホテル動物園前の歴史データ移行スクリプト
// Migration Script for Hotel Zoo Historical Data (2023-2025)
// ==================================================================

require('dotenv').config();
const mongoose = require('mongoose');
const DailyReport = require('./backend/models/dailyReportModel');
const MonthlyTarget = require('./backend/models/monthlyTargetModel');

// MongoDB接続
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB接続成功');
    } catch (error) {
        console.error('MongoDB接続エラー:', error);
        process.exit(1);
    }
};

// ホテル動物園前の歴史データ（2023-2025年）
const zooHotelData = {
    '2023': {
        '03': 8410000,
        '04': 7120000,
        '05': 6695000,
        '06': 5450000,
        '07': 7070000,
        '08': 6840000,
        '09': 6511043,
        '10': 6626082,
        '11': 6620821,
        '12': 6494088,
        '01': 4040960,
        '02': 6143913
    },
    '2024': {
        '03': 7696000,
        '04': 8134000,
        '05': 6649000,
        '06': 5231000,
        '07': 7122000,
        '08': 7330000,
        '09': 6740000,
        '10': 8020000,
        '11': 8350000,
        '12': 8470000,
        '01': 7320000,
        '02': 6670000
    },
    '2025': {
        '03': 7647000,
        '04': 9234000,
        '05': 10884000,
        '06': 7831403,
        '07': 8168774,
        '08': 8953572,
        '09': 12474790,
        '10': 11952696,
        '11': 8336634
    }
};

// データ移行処理
const migrateData = async () => {
    try {
        await connectDB();
        
        console.log('ホテル動物園前の歴史データ移行を開始します...\n');
        
        let totalInserted = 0;
        let totalSkipped = 0;
        
        for (const [year, months] of Object.entries(zooHotelData)) {
            console.log(`${year}年のデータを処理中...`);
            
            for (const [month, revenue] of Object.entries(months)) {
                // 日付を構築（各月の最終日を使用）
                let actualYear = year;
                let actualMonth = month;
                
                // 1月と2月は翌年として扱う（会計年度）
                if (month === '01' || month === '02') {
                    actualYear = String(parseInt(year) + 1);
                }
                
                const lastDay = new Date(parseInt(actualYear), parseInt(actualMonth), 0).getDate();
                const date = `${actualYear}-${actualMonth}-${String(lastDay).padStart(2, '0')}`;
                
                // 既存のデータをチェック
                const existing = await DailyReport.findOne({
                    hotel_name: 'ホテル動物園前',
                    date: date
                });
                
                if (existing) {
                    console.log(`  ${date}: スキップ（既に存在）`);
                    totalSkipped++;
                    continue;
                }
                
                // 月次売上目標を取得（存在しない場合は0）
                const monthKey = `${actualYear}-${actualMonth}`;
                const target = await MonthlyTarget.findOne({
                    hotel_name: 'ホテル動物園前',
                    month: monthKey
                });
                const monthlySalesTarget = target ? target.sales_target : 0;
                
                // 推定値を使用してデータを作成
                const reportData = {
                    hotel_name: 'ホテル動物園前',
                    date: date,
                    projected_revenue: revenue,
                    occupancy_rate_occ: 75, // 推定値
                    cumulative_sales: Math.floor(revenue / 30), // 推定値
                    average_daily_rate_adr: Math.floor(revenue / 30 / 20), // 推定値（30日、20室想定）
                    monthly_sales_target: monthlySalesTarget,
                    achievement_rate: monthlySalesTarget > 0 ? (revenue / monthlySalesTarget) * 100 : 0
                };
                
                await DailyReport.create(reportData);
                console.log(`  ${date}: 挿入成功 (¥${revenue.toLocaleString()})`);
                totalInserted++;
            }
            
            console.log('');
        }
        
        console.log('='.repeat(50));
        console.log(`移行完了！`);
        console.log(`挿入: ${totalInserted}件`);
        console.log(`スキップ: ${totalSkipped}件`);
        console.log('='.repeat(50));
        
        await mongoose.connection.close();
        console.log('\nMongoDB接続を閉じました。');
        
    } catch (error) {
        console.error('移行エラー:', error);
        process.exit(1);
    }
};

// スクリプト実行
migrateData();
