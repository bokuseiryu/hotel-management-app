// ホテル動物園前の歴史データを在线数据库に移行するスクリプト
const mongoose = require('mongoose');
require('dotenv').config();

const DailyReport = require('./backend/models/dailyReportModel');
const MonthlyTarget = require('./backend/models/monthlyTargetModel');

const executeMigration = async () => {
    try {
        // MongoDB接続
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://bokuseiryu:Lry19980908@cluster0.mongodb.net/hotel-management?retryWrites=true&w=majority';
        await mongoose.connect(mongoUri);
        console.log('MongoDB接続成功');
        
        // ホテル動物園前の歴史データ（2023年1月-2025年12月）
        const zooHotelData = {
            '2023': {
                '01': 6575322, '02': 6239913, '03': 8410000, '04': 7120000,
                '05': 6695000, '06': 5450000, '07': 7070000, '08': 6840000,
                '09': 6511043, '10': 6626082, '11': 6620821, '12': 6494088
            },
            '2024': {
                '01': 4040960, '02': 6145913, '03': 7696000, '04': 8134000,
                '05': 6649000, '06': 5231000, '07': 7122000, '08': 7330000,
                '09': 6740000, '10': 8020000, '11': 8350000, '12': 8470000
            },
            '2025': {
                '01': 7320000, '02': 6670000, '03': 7647000, '04': 9934000,
                '05': 10884000, '06': 7831403, '07': 8168774, '08': 8953572,
                '09': 12474790, '10': 11952696, '11': 8336634, '12': 6054420
            }
        };
        
        let totalInserted = 0;
        let totalSkipped = 0;
        const results = [];
        
        for (const [year, months] of Object.entries(zooHotelData)) {
            for (const [month, revenue] of Object.entries(months)) {
                const actualYear = year;
                const actualMonth = month;
                
                const lastDay = new Date(parseInt(actualYear), parseInt(actualMonth), 0).getDate();
                const date = `${actualYear}-${actualMonth}-${String(lastDay).padStart(2, '0')}`;
                
                // 既存のデータをチェック
                const existing = await DailyReport.findOne({
                    hotel_name: 'ホテル動物園前',
                    date: date
                });
                
                if (existing) {
                    console.log(`スキップ: ${date} (既に存在)`);
                    results.push({ date, status: 'skipped', reason: '既に存在' });
                    totalSkipped++;
                    continue;
                }
                
                // 月次売上目標を取得
                const monthKey = `${actualYear}-${actualMonth}`;
                const target = await MonthlyTarget.findOne({
                    hotel_name: 'ホテル動物園前',
                    month: monthKey
                });
                const monthlySalesTarget = target ? target.sales_target : 0;
                
                // データを作成
                const reportData = {
                    hotel_name: 'ホテル動物園前',
                    date: date,
                    projected_revenue: revenue,
                    occupancy_rate_occ: 75, // 推定値
                    cumulative_sales: Math.floor(revenue / 30), // 推定値
                    average_daily_rate_adr: Math.floor(revenue / 30 / 20), // 推定値
                    monthly_sales_target: monthlySalesTarget,
                    achievement_rate: monthlySalesTarget > 0 ? (revenue / monthlySalesTarget) * 100 : 0
                };
                
                await DailyReport.create(reportData);
                console.log(`挿入成功: ${date} - ¥${revenue.toLocaleString()}`);
                results.push({ date, status: 'inserted', revenue });
                totalInserted++;
            }
        }
        
        console.log('\n=== 移行完了 ===');
        console.log(`挿入: ${totalInserted}件`);
        console.log(`スキップ: ${totalSkipped}件`);
        console.log(`合計: ${totalInserted + totalSkipped}件`);
        
        await mongoose.disconnect();
        console.log('\nMongoDB接続を切断しました');
        
    } catch (error) {
        console.error('エラー:', error);
        process.exit(1);
    }
};

executeMigration();
