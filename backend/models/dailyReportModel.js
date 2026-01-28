// ==================================================================
// 日報モデル (MongoDB)
// Daily Report Model (MongoDB)
// ==================================================================

const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
    hotel_name: {
        type: String,
        required: true,
        enum: ['ホテル新今宮', 'ホテル動物園前']
    },
    date: {
        type: String, // YYYY-MM-DD 形式で保存
        required: true
    },
    projected_revenue: {
        type: Number,
        required: true
    },
    occupancy_rate_occ: {
        type: Number,
        required: true
    },
    cumulative_sales: {
        type: Number,
        required: true
    },
    average_daily_rate_adr: {
        type: Number,
        required: true
    },
    monthly_sales_target: {
        type: Number,
        required: false,
        default: 0
    },
    achievement_rate: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// 達成率を計算してから保存
// Calculate achievement rate before saving
dailyReportSchema.pre('save', function(next) {
    if (this.monthly_sales_target > 0) {
        this.achievement_rate = (this.projected_revenue / this.monthly_sales_target) * 100;
    } else {
        this.achievement_rate = 0;
    }
    
    // update updated_at timestamp
    if (!this.isNew) {
        this.updated_at = Date.now();
    }

    next();
});

// 複合ユニークインデックスを作成（ホテル名と日付の組み合わせをユニークにする）
// Create a compound unique index
dailyReportSchema.index({ hotel_name: 1, date: 1 }, { unique: true });

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);

module.exports = DailyReport;
