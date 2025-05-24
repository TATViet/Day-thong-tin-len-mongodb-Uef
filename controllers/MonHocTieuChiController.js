// controllers/monHocTieuChiController.js
const MonHocTieuChi = require('../models/MonHocTieuChi');

exports.save = async (req, res) => {
    try {
        const { MaTieuChi, MaMH, LoaiDiem, DiemChon, TrongSo } = req.body;

        // Kiểm tra nếu record đã tồn tại
        const existing = await MonHocTieuChi.findOne({ MaTieuChi, MaMH });
        if (existing) {
            return res.render('allforms', { message: '❗ Tiêu chí môn học đã tồn tại!', activeTab: 'monHocTieuChi' });
        }

        const newMHTC = new MonHocTieuChi({
            MaTieuChi, MaMH, LoaiDiem, DiemChon, TrongSo
        });

        await newMHTC.save();
        res.render('allforms', { message: '✅ Đã lưu tiêu chí môn học mới!', activeTab: 'monHocTieuChi' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu tiêu chí môn học.', activeTab: 'monHocTieuChi' });
    }
};