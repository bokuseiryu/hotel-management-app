// ==================================================================
// データAPIルート (MongoDB)
// Data API Routes (MongoDB)
// ==================================================================

const express = require('express');
const { protect, isAdmin, isAdminOrManager } = require('../middleware/authMiddleware');
const DailyReport = require('../models/dailyReportModel');
const xlsx = require('xlsx');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/data/summary - 主要なKPIサマリーを取得（指定月のみ）+ 同比/環比/予測分析
router.get('/summary', protect, async (req, res, next) => {
    const { hotel, month } = req.query;
    if (!hotel) {
        return res.status(400).json({ message: 'ホテル名を指定してください。' });
    }

    try {
        // 月が指定されていない場合は当月を使用
        const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const [year, monthNum] = targetMonth.split('-').map(Number);
        
        // 指定月の月次売上目標を取得
        const MonthlyTarget = require('../models/monthlyTargetModel');
        const monthlyTarget = await MonthlyTarget.findOne({
            hotel_name: hotel,
            month: targetMonth
        });
        const monthlySalesTarget = monthlyTarget ? monthlyTarget.sales_target : 0;
        
        // 指定月の全データを取得（予測用）
        const currentMonthReports = await DailyReport.find({ 
            hotel_name: hotel,
            date: { $regex: `^${targetMonth}` }
        }).sort({ date: 'asc' });
        
        // 指定月の最新データを取得
        const latestReport = currentMonthReports.length > 0 
            ? currentMonthReports[currentMonthReports.length - 1] 
            : null;

        // 上月データ（環比用）
        const lastMonth = monthNum === 1 
            ? `${year - 1}-12` 
            : `${year}-${String(monthNum - 1).padStart(2, '0')}`;
        const lastMonthReport = await DailyReport.findOne({
            hotel_name: hotel,
            date: { $regex: `^${lastMonth}` }
        }).sort({ date: -1 });

        // 去年同月データ（同比用）
        const lastYearMonth = `${year - 1}-${String(monthNum).padStart(2, '0')}`;
        const lastYearReport = await DailyReport.findOne({
            hotel_name: hotel,
            date: { $regex: `^${lastYearMonth}` }
        }).sort({ date: -1 });

        if (latestReport) {
            // 達成率を再計算
            const achievementRate = monthlySalesTarget > 0 
                ? (latestReport.projected_revenue / monthlySalesTarget) * 100 
                : 0;
            
            // 環比計算（与上月对比）
            const momChange = lastMonthReport && lastMonthReport.projected_revenue > 0
                ? ((latestReport.projected_revenue - lastMonthReport.projected_revenue) / lastMonthReport.projected_revenue) * 100
                : null;

            // 同比計算（与去年同月对比）
            const yoyChange = lastYearReport && lastYearReport.projected_revenue > 0
                ? ((latestReport.projected_revenue - lastYearReport.projected_revenue) / lastYearReport.projected_revenue) * 100
                : null;

            // 预测月末业绩
            let predictedRevenue = 0;
            let predictionConfidence = 0;
            if (currentMonthReports.length > 0) {
                const currentDay = new Date(latestReport.date).getDate();
                const daysInMonth = new Date(year, monthNum, 0).getDate();
                const avgDailyRevenue = latestReport.projected_revenue / currentDay;
                predictedRevenue = avgDailyRevenue * daysInMonth;
                
                // 预测置信度（数据越多越准确）
                predictionConfidence = Math.min((currentDay / daysInMonth) * 100, 95);
            }
            
            res.json({
                monthly_sales_target: monthlySalesTarget,
                projected_revenue: latestReport.projected_revenue,
                achievement_rate: achievementRate,
                average_daily_rate_adr: latestReport.average_daily_rate_adr,
                occupancy_rate_occ: latestReport.occupancy_rate_occ,
                // 新增：同比/環比
                mom_change: momChange,
                yoy_change: yoyChange,
                // 新增：预测数据
                predicted_revenue: Math.round(predictedRevenue),
                prediction_confidence: Math.round(predictionConfidence),
                predicted_achievement_rate: monthlySalesTarget > 0 
                    ? (predictedRevenue / monthlySalesTarget) * 100 
                    : 0,
                current_day: new Date(latestReport.date).getDate(),
                days_in_month: new Date(year, monthNum, 0).getDate()
            });
        } else {
            // 指定月のデータがない場合は月次売上目標のみ返す
            res.json({
                monthly_sales_target: monthlySalesTarget,
                projected_revenue: 0,
                achievement_rate: 0,
                average_daily_rate_adr: 0,
                occupancy_rate_occ: 0,
                mom_change: null,
                yoy_change: null,
                predicted_revenue: 0,
                prediction_confidence: 0,
                predicted_achievement_rate: 0
            });
        }
    } catch (error) {
        next(error);
    }
});

// GET /api/data/trends - 日次トレンドデータを取得（指定月のみ）
router.get('/trends', protect, async (req, res, next) => {
    const { hotel, metric, month } = req.query;
    if (!hotel || !metric) {
        return res.status(400).json({ message: 'ホテル名とメトリックを指定してください。' });
    }

    const validMetrics = ['projected_revenue', 'occupancy_rate_occ', 'cumulative_sales', 'average_daily_rate_adr', 'achievement_rate'];
    if (!validMetrics.includes(metric)) {
        return res.status(400).json({ message: '無効なメトリックです。' });
    }

    try {
        // 月が指定されていない場合は当月を使用
        const targetMonth = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        
        // 指定月のデータのみを取得
        const trends = await DailyReport.find({ 
            hotel_name: hotel,
            date: { $regex: `^${targetMonth}` }
        })
            .sort({ date: 'asc' })
            .select(`date ${metric} monthly_sales_target`);
        
        // 指定月の月次売上目標を取得
        const MonthlyTarget = require('../models/monthlyTargetModel');
        const monthlyTarget = await MonthlyTarget.findOne({
            hotel_name: hotel,
            month: targetMonth
        });
        const targetValue = monthlyTarget ? monthlyTarget.sales_target : 0;
        
        // 前端期待のフォーマットに変換
        // Convert to format expected by frontend
        const formattedTrends = trends.map(item => ({
            date: item.date,
            value: item[metric],
            target: metric === 'projected_revenue' ? targetValue : null
        }));
        
        res.json(formattedTrends);
    } catch (error) {
        next(error);
    }
});

// GET /api/data/reports - 指定された月の日報リストを取得
router.get('/reports', protect, async (req, res, next) => {
    const { hotel, month } = req.query; // month is YYYY-MM
    if (!hotel || !month) {
        return res.status(400).json({ message: 'ホテル名と月を指定してください。' });
    }

    try {
        const reports = await DailyReport.find({
            hotel_name: hotel,
            date: { $regex: `^${month}` }
        }).sort({ date: 'desc' });
        
        // _idをidにマッピングして返す
        // Map _id to id for frontend compatibility
        const formattedReports = reports.map(report => ({
            ...report.toObject(),
            id: report._id.toString()
        }));
        
        res.json(formattedReports);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reports - 新しい日報を作成（管理者または一般管理者）
router.post('/reports', protect, isAdminOrManager, async (req, res, next) => {
    try {
        const reportData = { ...req.body };
        
        // 月売上目標が提供されていない場合、MonthlyTargetから取得
        // If monthly_sales_target is not provided, fetch from MonthlyTarget
        if (!reportData.monthly_sales_target || reportData.monthly_sales_target === 0) {
            const MonthlyTarget = require('../models/monthlyTargetModel');
            const month = reportData.date.slice(0, 7); // YYYY-MM
            const target = await MonthlyTarget.findOne({
                hotel_name: reportData.hotel_name,
                month: month
            });
            reportData.monthly_sales_target = target ? target.sales_target : 0;
        }
        
        const newReport = new DailyReport(reportData);
        const savedReport = await newReport.save(); // pre-saveフックがここで実行される
        
        // TODO: Socket.IO通知を再実装

        res.status(201).json(savedReport);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'この日付のレポートは既に存在します。' });
        }
        next(error);
    }
});

// PUT /api/data/reports/:id - 日報を更新（管理者または一般管理者）
router.put('/reports/:id', protect, isAdminOrManager, async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: '無効なIDです。' });
    }

    try {
        const report = await DailyReport.findById(id);
        if (!report) {
            return res.status(404).json({ message: '指定されたIDのレポートが見つかりません。' });
        }

        Object.assign(report, req.body);
        const updatedReport = await report.save(); // pre-saveフックがここで実行される

        // TODO: Socket.IO通知を再実装

        res.json(updatedReport);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/data/reports/:id - 日報を削除（管理者または一般管理者）
router.delete('/reports/:id', protect, isAdminOrManager, async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: '無効なIDです。' });
    }

    try {
        const report = await DailyReport.findById(id);
        if (!report) {
            return res.status(404).json({ message: '指定されたIDのレポートが見つかりません。' });
        }

        await DailyReport.findByIdAndDelete(id);

        // TODO: Socket.IO通知を再実装

        res.json({ message: 'データが正常に削除されました。' });
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reports/batch - バッチインポート（管理者または一般管理者）
router.post('/reports/batch', protect, isAdminOrManager, async (req, res, next) => {
    try {
        const { reports } = req.body;
        
        if (!reports || !Array.isArray(reports) || reports.length === 0) {
            return res.status(400).json({ message: 'インポートするデータがありません。' });
        }

        const MonthlyTarget = require('../models/monthlyTargetModel');
        const results = { success: 0, updated: 0, errors: [] };

        for (const reportData of reports) {
            try {
                // 月売上目標を取得
                if (!reportData.monthly_sales_target || reportData.monthly_sales_target === 0) {
                    const month = reportData.date.slice(0, 7);
                    const target = await MonthlyTarget.findOne({
                        hotel_name: reportData.hotel_name,
                        month: month
                    });
                    reportData.monthly_sales_target = target ? target.sales_target : 0;
                }

                // 既存のデータをチェック
                const existing = await DailyReport.findOne({
                    hotel_name: reportData.hotel_name,
                    date: reportData.date
                });

                if (existing) {
                    // 更新
                    Object.assign(existing, reportData);
                    await existing.save();
                    results.updated++;
                } else {
                    // 新規作成
                    const newReport = new DailyReport(reportData);
                    await newReport.save();
                    results.success++;
                }
            } catch (err) {
                results.errors.push({ date: reportData.date, error: err.message });
            }
        }

        res.json({
            message: `インポート完了: ${results.success}件作成, ${results.updated}件更新`,
            ...results
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/data/export - データをエクスポート（日付範囲対応）
router.get('/export', protect, isAdminOrManager, async (req, res, next) => {
    const { hotel, year, startDate, endDate } = req.query;
    
    // 日付範囲が指定されている場合
    if (hotel && startDate && endDate) {
        try {
            const reports = await DailyReport.find({
                hotel_name: hotel,
                date: { $gte: startDate, $lte: endDate }
            }).sort({ date: 1 });

            res.json(reports);
        } catch (error) {
            next(error);
        }
        return;
    }
    
    // 従来の年次エクスポート
    if (!hotel || !year) {
        return res.status(400).json({ message: 'ホテル名と年（YYYY）を指定してください。' });
    }

    try {
        const monthlyReports = await DailyReport.aggregate([
            { $match: { hotel_name: hotel, date: { $regex: `^${year}` } } },
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: { $substr: ['$date', 0, 7] }, // YYYY-MMでグループ化
                    lastReport: { $first: '$$ROOT' } // 各月の最後のドキュメントを取得
                }
            },
            { $replaceRoot: { newRoot: '$lastReport' } },
            { $sort: { date: 1 } },
            {
                $project: {
                    '年月': { $substr: ['$date', 0, 7] },
                    'ホテル名': '$hotel_name',
                    '月末まで回収予定額': '$projected_revenue',
                    '稼働率OCC (%)': '$occupancy_rate_occ',
                    '当月累計販売数': '$cumulative_sales',
                    '平均単価ADR': '$average_daily_rate_adr',
                    '月売上目標': '$monthly_sales_target',
                    '達成率 (%)': { $round: ['$achievement_rate', 1] },
                    _id: 0
                }
            }
        ]);

        if (monthlyReports.length === 0) {
            return res.status(404).json({ message: '指定された年のデータが見つかりません。' });
        }

        const worksheet = xlsx.utils.json_to_sheet(monthlyReports);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, '年次レポート');

        const filename = `年次レポート_${hotel.replace(/\s/g, '_')}_${year}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (error) {
        next(error);
    }
});

// GET /api/data/monthly-trends - 年間の月次トレンドデータを取得
router.get('/monthly-trends', protect, async (req, res, next) => {
    const { hotel, year } = req.query;
    if (!hotel || !year) {
        return res.status(400).json({ message: 'ホテル名と年を指定してください。' });
    }

    try {
        const trends = await DailyReport.aggregate([
            { $match: { hotel_name: hotel, date: { $regex: `^${year}` } } },
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: { $substr: ['$date', 0, 7] },
                    lastReport: { $first: '$$ROOT' }
                }
            },
            { $sort: { '_id': 1 } },
            {
                $project: {
                    month: '$_id',
                    projected_revenue: '$lastReport.projected_revenue',
                    average_daily_rate_adr: '$lastReport.average_daily_rate_adr',
                    achievement_rate: '$lastReport.achievement_rate',
                    _id: 0
                }
            }
        ]);
        res.json(trends);
    } catch (error) {
        next(error);
    }
});

// GET /api/data/updated-dates - For AdminPanel calendar
router.get('/updated-dates', protect, isAdminOrManager, async (req, res, next) => {
    const { hotel, month } = req.query; // YYYY-MM
    if (!hotel || !month) {
        return res.status(400).json({ message: 'ホテル名と月を指定してください。' });
    }
    try {
        const dates = await DailyReport.distinct('date', {
            hotel_name: hotel,
            date: { $regex: `^${month}` }
        });
        res.json(dates);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
