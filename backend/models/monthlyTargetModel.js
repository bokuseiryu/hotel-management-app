// ==================================================================
// 月次売上目標モデル (MongoDB)
// Monthly Sales Target Model (MongoDB)
// ==================================================================

const mongoose = require('mongoose');

const monthlyTargetSchema = new mongoose.Schema({
    hotel_name: {
        type: String,
        required: true,
        trim: true
    },
    // 会計年度（3月〜翌年2月）例：2026年度は2026-03〜2027-02
    // Fiscal year (March to February of the following year)
    fiscal_year: {
        type: String,
        required: true,
        trim: true
    },
    // 月（YYYY-MM形式）
    // Month in YYYY-MM format
    month: {
        type: String,
        required: true,
        trim: true
    },
    // 月売上目標
    // Monthly sales target
    sales_target: {
        type: Number,
        required: true,
        default: 0
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// 複合ユニークインデックス：同じホテル・月の組み合わせは1つだけ
// Compound unique index: only one record per hotel-month combination
monthlyTargetSchema.index({ hotel_name: 1, month: 1 }, { unique: true });

// _id を id にマッピング
// Map _id to id for frontend compatibility
monthlyTargetSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});

const MonthlyTarget = mongoose.model('MonthlyTarget', monthlyTargetSchema);

module.exports = MonthlyTarget;
