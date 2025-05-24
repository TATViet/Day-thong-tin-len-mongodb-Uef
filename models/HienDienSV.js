// models/HienDienSV.js
const mongoose = require('mongoose');

const HienDienSVSchema = new mongoose.Schema({
    HienDienSV: { type: Number, required: true },
    MaSV: { type: String, required: true },
    MaKhoa: { type: String, required: true },
    MaNgChng: { type: String, required: true },
    MaKhoi: { type: String, required: true },
    NamHocKy: { type: Number, required: true }
}, {
    // Composite primary key equivalent
    indexes: [
        { fields: { MaSV: 1, NamHocKy: 1 }, unique: true }
    ]
});

module.exports = mongoose.model('HienDienSV', HienDienSVSchema);