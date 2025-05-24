// controllers/diemSinhVienController.js
const DiemSinhVien = require('../models/DiemSinhVien');

exports.save = async (req, res) => {
    try {
        const { MaSV, MaMH, NhomHoc, QuaTrinh, GiuaKy, CuoiKy, DiemHP, DiemSoHP, DiemChuHP, NamHK } = req.body;

        // Kiểm tra nếu record đã tồn tại
        const existing = await DiemSinhVien.findOne({ MaSV, MaMH, NhomHoc, NamHK });
        if (existing) {
            return res.render('allforms', { message: '❗ Điểm sinh viên đã tồn tại!', activeTab: 'diemSinhVien' });
        }

        const newDiem = new DiemSinhVien({
            MaSV, MaMH, NhomHoc, QuaTrinh, GiuaKy, CuoiKy, DiemHP, DiemSoHP, DiemChuHP, NamHK
        });

        await newDiem.save();
        res.render('allforms', { message: '✅ Đã lưu điểm sinh viên mới!', activeTab: 'diemSinhVien' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu điểm sinh viên.', activeTab: 'diemSinhVien' });
    }
};