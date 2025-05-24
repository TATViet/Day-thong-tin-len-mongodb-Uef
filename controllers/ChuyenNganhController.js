// controllers/chuyenNganhController.js
const ChuyenNganh = require('../models/ChuyenNganh');

exports.save = async (req, res) => {
    try {
        const { MaCN, TenCN, MaDV } = req.body;

        // Kiểm tra nếu MaCN đã tồn tại
        const existing = await ChuyenNganh.findOne({ MaCN });
        if (existing) {
            return res.render('allforms', { message: '❗ Mã chuyên ngành đã tồn tại!', activeTab: 'chuyenNganh' });
        }

        const newCN = new ChuyenNganh({
            MaCN, TenCN, MaDV
        });

        await newCN.save();
        res.render('allforms', { message: '✅ Đã lưu chuyên ngành mới!', activeTab: 'chuyenNganh' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu chuyên ngành.', activeTab: 'chuyenNganh' });
    }
};