// ==================================================================
// 月次売上目標APIルート (MongoDB)
// Monthly Sales Target API Routes (MongoDB)
// ==================================================================

const express = require('express');
const MonthlyTarget = require('../models/monthlyTargetModel');
const { protect, isAdminOrManager } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/targets - 特定年度の月次目標を取得
// Get monthly targets for a specific fiscal year
router.get('/', protect, async (req, res, next) => {
    const { hotel, fiscal_year } = req.query;
    
    if (!hotel || !fiscal_year) {
        return res.status(400).json({ message: 'ホテル名と会計年度を指定してください。' });
    }

    try {
        const targets = await MonthlyTarget.find({
            hotel_name: hotel,
            fiscal_year: fiscal_year
        }).sort({ month: 1 });
        
        res.json(targets);
    } catch (error) {
        next(error);
    }
});

// GET /api/targets/current - 当月の売上目標を取得
// Get current month's sales target
router.get('/current', protect, async (req, res, next) => {
    const { hotel, month } = req.query;
    
    if (!hotel || !month) {
        return res.status(400).json({ message: 'ホテル名と月を指定してください。' });
    }

    try {
        const target = await MonthlyTarget.findOne({
            hotel_name: hotel,
            month: month
        });
        
        res.json(target || { sales_target: 0 });
    } catch (error) {
        next(error);
    }
});

// POST /api/targets - 月次目標を設定/更新（upsert）
// Set or update monthly targets (upsert)
router.post('/', protect, isAdminOrManager, async (req, res, next) => {
    const { hotel_name, fiscal_year, targets } = req.body;
    
    if (!hotel_name || !fiscal_year || !targets || !Array.isArray(targets)) {
        return res.status(400).json({ message: 'ホテル名、会計年度、目標データを指定してください。' });
    }

    try {
        const results = [];
        
        for (const target of targets) {
            const result = await MonthlyTarget.findOneAndUpdate(
                { hotel_name, month: target.month },
                {
                    hotel_name,
                    fiscal_year,
                    month: target.month,
                    sales_target: target.sales_target,
                    updated_at: new Date()
                },
                { upsert: true, new: true }
            );
            results.push(result);
        }
        
        res.json({
            message: '月次目標が正常に保存されました。',
            data: results
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/targets/:month - 特定月の目標を更新
// Update target for a specific month
router.put('/:month', protect, isAdminOrManager, async (req, res, next) => {
    const { month } = req.params;
    const { hotel_name, sales_target, fiscal_year } = req.body;
    
    if (!hotel_name || sales_target === undefined) {
        return res.status(400).json({ message: 'ホテル名と売上目標を指定してください。' });
    }

    try {
        const target = await MonthlyTarget.findOneAndUpdate(
            { hotel_name, month },
            {
                hotel_name,
                fiscal_year: fiscal_year || month.slice(0, 4),
                month,
                sales_target,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );
        
        res.json({
            message: '月次目標が正常に更新されました。',
            data: target
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
