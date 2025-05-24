// controllers/tinhDiemTieuChiController.js
const TinhDiemTieuChi = require('../models/TinhDiemTieuChi');

exports.save = async (req, res) => {
    try {
        const { MaSV, MaTieuChi, DiemTongKet, MucDoDat } = req.body;

        const newTDTC = new TinhDiemTieuChi({
            MaSV, MaTieuChi, DiemTongKet, MucDoDat
        });

        await newTDTC.save();
        res.render('allforms', { message: '✅ Đã lưu tính điểm tiêu chí mới!', activeTab: 'tinhDiemTieuChi' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu tính điểm tiêu chí.', activeTab: 'tinhDiemTieuChi' });
    }
};