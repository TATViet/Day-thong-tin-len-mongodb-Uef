// models/MonHocTieuChi.js
const mongoose = require('mongoose');

const MonHocTieuChiSchema = new mongoose.Schema({
    MaTieuChi: { type: String, required: true },
    MaMH: { type: String, required: true },
    LoaiDiem: String,
    DiemChon: Number,
    TrongSo: Number,
    NgayTao: { type: Date, default: Date.now }
}, {
    // Composite primary key equivalent
    indexes: [
        { fields: { MaTieuChi: 1, MaMH: 1 }, unique: true }
    ]
});

module.exports = mongoose.model('MonHocTieuChi', MonHocTieuChiSchema);