// ==================================================================
// 料金表ルート (MongoDB)
// Price Table Routes (MongoDB)
// ==================================================================

const express = require('express');
const router = express.Router();
const PriceTable = require('../models/priceTableModel');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// 価格を計算するユーティリティ関数
function calculateRoomPrices(room_types, price_plans) {
    return room_types.map(room => {
        const prices = {};
        price_plans.forEach(plan => {
            prices[plan.plan_name] = Math.round(room.base_price * (1 + plan.discount_rate / 100));
        });
        return { ...room, prices };
    });
}

// GET /api/price-tables
router.get('/', protect, isAdmin, async (req, res, next) => {
    try {
        const { hotel, year, month } = req.query;
        const filter = {};
        if (hotel) filter.hotel_name = hotel;
        if (year) filter.year = year;
        if (month) filter.month = month;
        const priceTables = await PriceTable.find(filter)
            .select('-change_history')
            .sort({ year: -1, month: -1 });
        res.json(priceTables);
    } catch (error) { next(error); }
});

// GET /api/price-tables/:id
router.get('/:id', protect, isAdmin, async (req, res, next) => {
    try {
        const priceTable = await PriceTable.findById(req.params.id);
        if (!priceTable) return res.status(404).json({ message: '料金表が見つかりません。' });
        res.json(priceTable);
    } catch (error) { next(error); }
});

// GET /api/price-tables/:id/history
router.get('/:id/history', protect, isAdmin, async (req, res, next) => {
    try {
        const priceTable = await PriceTable.findById(req.params.id).select('change_history hotel_name year month');
        if (!priceTable) return res.status(404).json({ message: '料金表が見つかりません。' });
        res.json(priceTable.change_history.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at)));
    } catch (error) { next(error); }
});

// POST /api/price-tables
router.post('/', protect, isAdmin, async (req, res, next) => {
    try {
        const { hotel_name, year, month, tax_type, tax_rate, room_types, price_plans, notes } = req.body;
        const existing = await PriceTable.findOne({ hotel_name, year, month });
        if (existing) return res.status(400).json({ message: `${hotel_name} ${year}年${month}月の料金表は既に存在します。` });
        const calculatedRoomTypes = calculateRoomPrices(room_types, price_plans);
        const priceTable = new PriceTable({
            hotel_name, year, month,
            tax_type: tax_type || 'tax_excluded',
            tax_rate: tax_rate || 10,
            room_types: calculatedRoomTypes,
            price_plans, notes: notes || '',
            created_by: req.user.username,
            change_history: [{ action: 'created', changed_by: req.user.username, memo: `${year}年${month}月 料金表を新規作成` }]
        });
        await priceTable.save();
        res.status(201).json(priceTable);
    } catch (error) { next(error); }
});

// PUT /api/price-tables/:id
router.put('/:id', protect, isAdmin, async (req, res, next) => {
    try {
        const priceTable = await PriceTable.findById(req.params.id);
        if (!priceTable) return res.status(404).json({ message: '料金表が見つかりません。' });
        const { tax_type, tax_rate, room_types, price_plans, notes, memo } = req.body;
        const beforeData = JSON.stringify({ tax_type: priceTable.tax_type, tax_rate: priceTable.tax_rate, room_types: priceTable.room_types, price_plans: priceTable.price_plans, notes: priceTable.notes });
        const calculatedRoomTypes = calculateRoomPrices(room_types, price_plans);
        priceTable.tax_type = tax_type || priceTable.tax_type;
        priceTable.tax_rate = tax_rate !== undefined ? tax_rate : priceTable.tax_rate;
        priceTable.room_types = calculatedRoomTypes;
        priceTable.price_plans = price_plans;
        priceTable.notes = notes !== undefined ? notes : priceTable.notes;
        priceTable.updated_at = new Date();
        priceTable.change_history.push({ action: 'updated', changed_by: req.user.username, before_data: beforeData, memo: memo || '料金表を更新' });
        await priceTable.save();
        res.json(priceTable);
    } catch (error) { next(error); }
});

// DELETE /api/price-tables/:id
router.delete('/:id', protect, isAdmin, async (req, res, next) => {
    try {
        const priceTable = await PriceTable.findById(req.params.id);
        if (!priceTable) return res.status(404).json({ message: '料金表が見つかりません。' });
        const info = { hotel_name: priceTable.hotel_name, year: priceTable.year, month: priceTable.month };
        await PriceTable.findByIdAndDelete(req.params.id);
        res.json({ message: `${info.hotel_name} ${info.year}年${info.month}月の料金表を削除しました。` });
    } catch (error) { next(error); }
});

module.exports = router;
