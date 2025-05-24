// models/TieuChiDauRa.js
const mongoose = require('mongoose');

const TieuChiDauRaSchema = new mongoose.Schema({
    MaTieuChi: { type: String, required: true, unique: true },
    MaKhoi: String,
    MaNgChng: String,
    MaDV: String,
    NhomPLO: String, //NhomTieuChi
    MaPLO: String,
    NoiDungTieuChi: String,
    NgayTao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TieuChiDauRa', TieuChiDauRaSchema);