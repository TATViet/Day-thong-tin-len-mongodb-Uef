// models/DiemSinhVien.js
const mongoose = require('mongoose');

const DiemSinhVienSchema = new mongoose.Schema({
    MaSV: { type: String, required: true },
    MaMH: { type: String, required: true },
    NhomHoc: { type: String, required: true },
    QuaTrinh: String,
    GiuaKy: String,
    CuoiKy: String,
    DiemHP: String,
    DiemSoHP: String,
    DiemChuHP: String,
    NamHK: { type: Number, required: true }
}, {
    // Composite primary key equivalent
    indexes: [
        { fields: { MaSV: 1, MaMH: 1, NhomHoc: 1, NamHK: 1 }, unique: true }
    ]
});

module.exports = mongoose.model('DiemSinhVien', DiemSinhVienSchema);