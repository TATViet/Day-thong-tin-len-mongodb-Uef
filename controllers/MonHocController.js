// controllers/monHocController.js
const MonHoc = require('../models/MonHoc');

exports.save = async (req, res) => {
    try {
        const { MaMH, TenMH, SoTietMH, SoTinChi, MaDV } = req.body;

        // Kiểm tra nếu MaMH đã tồn tại
        const existing = await MonHoc.findOne({ MaMH });
        if (existing) {
            return res.render('allforms', { message: '❗ Mã môn học đã tồn tại!', activeTab: 'monHoc' });
        }

        const newMH = new MonHoc({
            MaMH, TenMH, SoTietMH, SoTinChi, MaDV
        });

        await newMH.save();
        res.render('allforms', { message: '✅ Đã lưu môn học mới!', activeTab: 'monHoc' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu môn học.', activeTab: 'monHoc' });
    }
};