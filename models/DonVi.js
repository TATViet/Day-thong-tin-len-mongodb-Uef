// models/DonVi.js
const mongoose = require('mongoose');

const DonViSchema = new mongoose.Schema({
    MaDV: { type: String, required: true, unique: true },
    TenDV: String
});

module.exports = mongoose.model('DonVi', DonViSchema);