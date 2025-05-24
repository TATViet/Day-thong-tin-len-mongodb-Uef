// models/MonHoc.js
const mongoose = require('mongoose');

const MonHocSchema = new mongoose.Schema({
    MaMH: { type: String, required: true, unique: true },
    TenMH: String,
    SoTietMH: Number,
    SoTinChi: Number,
    MaDV: String
});

module.exports = mongoose.model('MonHoc', MonHocSchema);