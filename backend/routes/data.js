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

// GET /api/data/summary - 主要なKPIサマリーを取得
router.get('/summary', protect, async (req, res, next) => {
    const { hotel } = req.query;
    if (!hotel) {
        return res.status(400).json({ message: 'ホテル名を指定してください。' });
    }

    try {
        const latestReport = await DailyReport.findOne({ hotel_name: hotel })
            .sort({ date: -1 });

        if (latestReport) {
            res.json({
                monthly_sales_target: latestReport.monthly_sales_target,
                projected_revenue: latestReport.projected_revenue,
                achievement_rate: latestReport.achievement_rate,
                average_daily_rate_adr: latestReport.average_daily_rate_adr
            });
        } else {
            res.json({}); // データがない場合は空のオブジェクトを返す
        }
    } catch (error) {
        next(error);
    }
});

// GET /api/data/trends - 日次トレンドデータを取得
router.get('/trends', protect, async (req, res, next) => {
    const { hotel, metric } = req.query;
    if (!hotel || !metric) {
        return res.status(400).json({ message: 'ホテル名とメトリックを指定してください。' });
    }

    const validMetrics = ['projected_revenue', 'occupancy_rate_occ', 'cumulative_sales', 'average_daily_rate_adr', 'achievement_rate'];
    if (!validMetrics.includes(metric)) {
        return res.status(400).json({ message: '無効なメトリックです。' });
    }

    try {
        const trends = await DailyReport.find({ hotel_name: hotel })
            .sort({ date: 'asc' })
            .select(`date ${metric} monthly_sales_target`);
        
        // 前端期望的フォーマットに変換
        // Convert to format expected by frontend
        let formattedTrends = trends.map(item => ({
            date: item.date,
            value: item[metric],
            target: metric === 'projected_revenue' ? item.monthly_sales_target : null
        }));
        
        // 空値や0をフィルタリングし、最後の有効なデータまでを表示
        // Filter out null/0 values and show only up to last valid data
        if (formattedTrends.length > 0) {
            // 最後の有効なデータ（valueがnullでも0でもない）のインデックスを見つける
            // Find index of last valid data (value is neither null nor 0)
            let lastValidIndex = -1;
            for (let i = formattedTrends.length - 1; i >= 0; i--) {
                if (formattedTrends[i].value !== null && 
                    formattedTrends[i].value !== undefined && 
                    formattedTrends[i].value !== 0) {
                    lastValidIndex = i;
                    break;
                }
            }
            
            // 最後の有効なデータまでをトリム
            // Trim up to last valid data
            if (lastValidIndex >= 0) {
                formattedTrends = formattedTrends.slice(0, lastValidIndex + 1);
            } else {
                // 有効なデータがない場合
                // If no valid data exists
                formattedTrends = [];
            }
        }
        
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
        res.json(reports);
    } catch (error) {
        next(error);
    }
});

// POST /api/data/reports - 新しい日報を作成（管理者または一般管理者）
router.post('/reports', protect, isAdminOrManager, async (req, res, next) => {
    try {
        const newReport = new DailyReport(req.body);
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

// GET /api/data/export - 年次データをExcelにエクスポート（管理者または一般管理者）
router.get('/export', protect, isAdminOrManager, async (req, res, next) => {
    const { hotel, year } = req.query;
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
