// データベース内の動物園前ホテルのデータを確認するスクリプト
const mongoose = require('mongoose');
require('dotenv').config();

const DailyReport = require('./backend/models/dailyReportModel');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB接続成功');
        
        // 2025年のデータを取得
        const reports2025 = await DailyReport.find({
            hotel_name: 'ホテル動物園前',
            date: { $regex: '^2025' }
        }).sort({ date: 1 });
        
        console.log('\n=== 2025年のデータ ===');
        console.log(`合計: ${reports2025.length}件`);
        
        if (reports2025.length > 0) {
            console.log('\n月別データ:');
            reports2025.forEach(report => {
                console.log(`${report.date}: ¥${report.projected_revenue.toLocaleString()}`);
            });
        } else {
            console.log('データが見つかりません！');
        }
        
        // 全年度のデータ数を確認
        const allReports = await DailyReport.find({
            hotel_name: 'ホテル動物園前'
        });
        console.log(`\n全データ数: ${allReports.length}件`);
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('エラー:', error);
        process.exit(1);
    }
};

checkData();
