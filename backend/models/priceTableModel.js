// ==================================================================
// 料金表モデル (MongoDB)
// Price Table Model (MongoDB)
// ==================================================================

const mongoose = require('mongoose');

const pricePlanSchema = new mongoose.Schema({
    plan_name: { type: String, required: true, trim: true },
    discount_rate: { type: Number, required: true, default: 0 },
    plan_type: { type: String, enum: ['base', 'discount', 'premium'], default: 'base' },
    display_order: { type: Number, default: 0 }
}, { _id: false });

const roomTypeSchema = new mongoose.Schema({
    room_type: { type: String, required: true, trim: true },
    category: { type: String, enum: ['capsule', 'standard', 'japanese'], default: 'standard' },
    base_price: { type: Number, required: true, min: 0 },
    prices: { type: Map, of: Number, default: {} }
}, { _id: false });

const changeHistorySchema = new mongoose.Schema({
    action: { type: String, enum: ['created', 'updated', 'deleted'], required: true },
    changed_by: { type: String, required: true },
    changed_at: { type: Date, default: Date.now },
    before_data: { type: String, default: null },
    memo: { type: String, default: '' }
}, { _id: true });

const priceTableSchema = new mongoose.Schema({
    hotel_name: { type: String, required: true, enum: ['ホテル新今宮', 'ホテル動物園前'], trim: true },
    year: { type: String, required: true, trim: true },
    month: { type: String, required: true, trim: true },
    tax_type: { type: String, enum: ['tax_included', 'tax_excluded'], default: 'tax_excluded' },
    tax_rate: { type: Number, default: 10 },
    room_types: [roomTypeSchema],
    price_plans: [pricePlanSchema],
    notes: { type: String, default: '' },
    created_by: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    change_history: [changeHistorySchema]
});

priceTableSchema.index({ hotel_name: 1, year: 1, month: 1 }, { unique: true });

priceTableSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
    }
});

const PriceTable = mongoose.model('PriceTable', priceTableSchema);

module.exports = PriceTable;
