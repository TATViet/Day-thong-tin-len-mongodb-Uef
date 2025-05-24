// models/NganhChuongTrinh.js
const mongoose = require('mongoose');

const NganhChuongTrinhSchema = new mongoose.Schema({
    MaNgChng: { type: String, required: true, unique: true },
    TenNgChng: { type: String, required: true }
});

module.exports = mongoose.model('NganhChuongTrinh', NganhChuongTrinhSchema);