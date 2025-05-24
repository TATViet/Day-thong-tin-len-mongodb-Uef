// controllers/donViController.js
const DonVi = require('../models/DonVi');

exports.save = async (req, res) => {
    try {
        const { MaDV, TenDV } = req.body;

        // Kiểm tra nếu MaDV đã tồn tại
        const existing = await DonVi.findOne({ MaDV });
        if (existing) {
            return res.render('allforms', { message: '❗ Mã đơn vị đã tồn tại!', activeTab: 'donVi' });
        }

        const newDV = new DonVi({
            MaDV, TenDV
        });

        await newDV.save();
        res.render('allforms', { message: '✅ Đã lưu đơn vị mới!', activeTab: 'donVi' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu đơn vị.', activeTab: 'donVi' });
    }
};