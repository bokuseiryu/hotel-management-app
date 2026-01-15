// ==================================================================
// データAPIルート
// Data API Routes
// ==================================================================

const express = require('express');
const dbManager = require('../src/utils/database');
const { protect, isAdmin, isAdminOrManager } = require('../middleware/authMiddleware');
const xlsx = require('xlsx');

const router = express.Router();
const dbInstance = dbManager.getInstance();
const db = dbInstance.connection;

// GET /api/data/summary - 主要なKPIサマリーを取得
router.get('/summary', protect, (req, res, next) => {
    const { hotel } = req.query;
    if (!hotel) {
        return res.status(400).json({ message: 'ホテル名を指定してください。' });
    }

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    const queries = {
        // 当月のADRの平均値を取得
        avg_adr: `SELECT AVG(average_daily_rate_adr) as avg_adr FROM daily_reports WHERE hotel_name = ? AND date BETWEEN ? AND ? AND average_daily_rate_adr > 0`,
        // 最新の有効な「月末まで回収予定額」と関連データを取得
        latest_valid_report: `SELECT projected_revenue, monthly_sales_target, occupancy_rate_occ FROM daily_reports WHERE hotel_name = ? AND projected_revenue > 0 ORDER BY date DESC LIMIT 1`
    };

    db.get(queries.avg_adr, [hotel, firstDayOfMonth, lastDayOfMonth], (err, adrData) => {
        if (err) return next(err);

        db.get(queries.latest_valid_report, [hotel], (err, latestReport) => {
            if (err) return next(err);

            const projected_revenue = latestReport?.projected_revenue || 0;
            const monthly_sales_target = latestReport?.monthly_sales_target || 0;
            const achievement_rate = monthly_sales_target > 0 ? (projected_revenue / monthly_sales_target) * 100 : 0;

            const summary = {
                projected_revenue: projected_revenue,
                average_daily_rate_adr: adrData?.avg_adr || 0,
                occupancy_rate_occ: latestReport?.occupancy_rate_occ || 0, // これは最新のものを表示し続ける
                achievement_rate: achievement_rate,
                monthly_sales_target: monthly_sales_target,
            };

            res.json(summary);
        });
    });
});

// GET /api/data/trends - 過去30日間のトレンドデータを取得
router.get('/trends', protect, (req, res, next) => {
    const { hotel, metric } = req.query;
    if (!hotel || !metric) {
        return res.status(400).json({ message: 'ホテル名と指標を指定してください。' });
    }

    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    let sql;
    switch (metric) {
        case 'projected_revenue':
            sql = `SELECT date, projected_revenue as value, monthly_sales_target as target FROM daily_reports WHERE hotel_name = ? AND date >= ? AND date <= ? ORDER BY date ASC`;
            break;
        case 'occupancy_rate_occ':
            sql = `SELECT date, occupancy_rate_occ as value FROM daily_reports WHERE hotel_name = ? AND date >= ? AND date <= ? ORDER BY date ASC`;
            break;
        default:
            return res.status(400).json({ message: '無効な指標です。' });
    }

    db.all(sql, [hotel, thirtyDaysAgo, today], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// GET /api/data/reports - 日報リストを取得
router.get('/reports', protect, (req, res, next) => {
    const { hotel, month } = req.query; // month format: YYYY-MM
    if (!hotel || !month) {
        return res.status(400).json({ message: 'ホテル名と月（YYYY-MM）を指定してください。' });
    }

    const sql = `SELECT * FROM daily_reports WHERE hotel_name = ? AND strftime('%Y-%m', date) = ? ORDER BY date DESC`;

    db.all(sql, [hotel, month], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// POST /api/data/reports - 新しい日報を作成（管理者または一般管理者）
router.post('/reports', protect, isAdminOrManager, (req, res, next) => {
    const { hotel_name, date, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr, monthly_sales_target } = req.body;

    if (!hotel_name || !date || projected_revenue === undefined || occupancy_rate_occ === undefined || cumulative_sales === undefined || average_daily_rate_adr === undefined || monthly_sales_target === undefined) {
        return res.status(400).json({ message: 'すべての必須フィールドを入力してください。' });
    }

    const sql = `INSERT INTO daily_reports (hotel_name, date, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr, monthly_sales_target) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [hotel_name, date, projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr, monthly_sales_target], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'このホテルのこの日付のデータは既に存在します。' });
            }
            return next(err);
        }
        db.get('SELECT * FROM daily_reports WHERE id = ?', [this.lastID], (err, newReport) => {
            if (err) return next(err);
            dbInstance.notifyUpdate({ action: 'create', data: newReport }); // リアルタイム通知
            res.status(201).json(newReport);
        });
    });
});

// PUT /api/data/reports/:id - 日報を更新（管理者または一般管理者）
router.put('/reports/:id', protect, isAdminOrManager, (req, res, next) => {
    const { id } = req.params;
    const { projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr, monthly_sales_target } = req.body;

    if (projected_revenue === undefined || occupancy_rate_occ === undefined || cumulative_sales === undefined || average_daily_rate_adr === undefined || monthly_sales_target === undefined) {
        return res.status(400).json({ message: 'すべての必須フィールドを入力してください。' });
    }

    const sql = `UPDATE daily_reports SET projected_revenue = ?, occupancy_rate_occ = ?, cumulative_sales = ?, average_daily_rate_adr = ?, monthly_sales_target = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, [projected_revenue, occupancy_rate_occ, cumulative_sales, average_daily_rate_adr, monthly_sales_target, id], function(err) {
        if (err) return next(err);
        if (this.changes === 0) {
            return res.status(404).json({ message: '指定されたIDのレポートが見つかりません。' });
        }
        db.get('SELECT * FROM daily_reports WHERE id = ?', [id], (err, updatedReport) => {
            if (err) return next(err);
            dbInstance.notifyUpdate({ action: 'update', data: updatedReport }); // リアルタイム通知
            res.json(updatedReport);
        });
    });
});

// GET /api/data/export - 年次データをExcelにエクスポート（管理者または一般管理者）
router.get('/export', protect, isAdminOrManager, (req, res, next) => {
    const { hotel, year } = req.query;
    if (!hotel || !year) {
        return res.status(400).json({ message: 'ホテル名と年（YYYY）を指定してください。' });
    }

    // 各月の月末データを取得するクエリ
    const sql = `
        WITH MonthlyLastData AS (
            SELECT 
                strftime('%Y-%m', date) AS month,
                date,
                hotel_name,
                projected_revenue,
                occupancy_rate_occ,
                cumulative_sales,
                average_daily_rate_adr,
                monthly_sales_target,
                achievement_rate,
                ROW_NUMBER() OVER (PARTITION BY strftime('%Y-%m', date) ORDER BY date DESC) as rn
            FROM daily_reports
            WHERE hotel_name = ? AND strftime('%Y', date) = ?
        )
        SELECT 
            month AS '年月',
            hotel_name AS 'ホテル名',
            projected_revenue AS '月末まで回収予定額',
            occupancy_rate_occ AS '稼働率OCC (%)',
            cumulative_sales AS '当月累計販売数',
            average_daily_rate_adr AS '平均単価ADR',
            monthly_sales_target AS '月売上目標',
            ROUND(achievement_rate, 1) AS '達成率 (%)'
        FROM MonthlyLastData
        WHERE rn = 1
        ORDER BY month ASC`;

    db.all(sql, [hotel, year], (err, rows) => {
        if (err) return next(err);
        if (rows.length === 0) {
            return res.status(404).json({ message: '指定された年のデータが見つかりません。' });
        }

        const worksheet = xlsx.utils.json_to_sheet(rows);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, '年次レポート');

        const filename = `年次レポート_${hotel.replace(/\s/g, '_')}_${year}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    });
});

// GET /api/data/monthly-trends - 年間の月次トレンドデータを取得
router.get('/monthly-trends', protect, (req, res, next) => {
    const { hotel, year } = req.query;
    if (!hotel || !year) {
        return res.status(400).json({ message: 'ホテル名と年を指定してください。' });
    }

    const sql = `
        WITH MonthlyData AS (
            SELECT
                strftime('%m', date) AS month,
                projected_revenue,
                average_daily_rate_adr,
                -- 各月内の日付の降順でランク付け
                ROW_NUMBER() OVER (PARTITION BY strftime('%Y-%m', date) ORDER BY date DESC) as rn
            FROM daily_reports
            WHERE hotel_name = ? AND strftime('%Y', date) = ?
        ),
        -- 各月の最終日の「月末まで回収予定額」
        LastProjectedRevenue AS (
            SELECT month, projected_revenue
            FROM MonthlyData
            WHERE rn = 1
        ),
        -- 各月の「平均単価ADR」の平均値
        AvgADR AS (
            SELECT 
                strftime('%m', date) AS month,
                AVG(average_daily_rate_adr) as avg_adr
            FROM daily_reports
            WHERE hotel_name = ? AND strftime('%Y', date) = ? AND average_daily_rate_adr > 0
            GROUP BY month
        )
        -- 結果を結合
        SELECT
            m.month,
            COALESCE(lpr.projected_revenue, 0) AS projected_revenue,
            COALESCE(adr.avg_adr, 0) AS average_daily_rate_adr
        FROM ( -- 1月から12月までの月リストを生成
            SELECT '01' AS month UNION ALL SELECT '02' UNION ALL SELECT '03' UNION ALL
            SELECT '04' UNION ALL SELECT '05' UNION ALL SELECT '06' UNION ALL
            SELECT '07' UNION ALL SELECT '08' UNION ALL SELECT '09' UNION ALL
            SELECT '10' UNION ALL SELECT '11' UNION ALL SELECT '12'
        ) m
        LEFT JOIN LastProjectedRevenue lpr ON m.month = lpr.month
        LEFT JOIN AvgADR adr ON m.month = adr.month
        ORDER BY m.month;
    `;

    db.all(sql, [hotel, year, hotel, year], (err, rows) => {
        if (err) return next(err);
        res.json(rows);
    });
});

// GET /api/data/updated-dates - 指定された月の更新済み日付リストを取得
router.get('/updated-dates', protect, (req, res, next) => {
    const { hotel, month } = req.query; // month format: YYYY-MM
    if (!hotel || !month) {
        return res.status(400).json({ message: 'ホテル名と月（YYYY-MM）を指定してください。' });
    }

    const sql = `SELECT DISTINCT date FROM daily_reports WHERE hotel_name = ? AND strftime('%Y-%m', date) = ?`;

    db.all(sql, [hotel, month], (err, rows) => {
        if (err) return next(err);
        const dates = rows.map(r => r.date);
        res.json(dates);
    });
});

module.exports = router;
