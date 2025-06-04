// models/TyTrongChuan.js
const mongoose = require('mongoose');

const TyTrongChuanSchema = new mongoose.Schema({
    SoPLO: {
        type: Number,
        required: true
    },
    DiemChon: {
        type: Number,
        required: true,
        default: 5.5
    },
    PLOData: [{
        PLO: {
            type: String,
            required: true 
        },
        TyTrong: [{
            NamHK: {
                type: String,
                required: true
            },
            GiaTri: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('TyTrongChuan', TyTrongChuanSchema);