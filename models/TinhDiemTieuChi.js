// models/TinhDiemTieuChi.js
const mongoose = require('mongoose');

const TinhDiemTieuChiSchema = new mongoose.Schema({
    // For MongoDB, we don't need to specify auto-increment ID fields
    // MongoDB will automatically create _id field
    MaSV: String,
    MaTieuChi: String,
    DiemTongKet: Number,
    MucDoDat: String,
    NgayTao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TinhDiemTieuChi', TinhDiemTieuChiSchema);