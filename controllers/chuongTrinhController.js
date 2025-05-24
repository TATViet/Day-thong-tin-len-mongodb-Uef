const ChuongTrinh = require('../models/ChuongTrinh');

// Hiển thị form
exports.form = (req, res) => {
    res.render('chuongtrinh', { message: null });
};

// Lưu dữ liệu
exports.save = async (req, res) => {
    try {
        const { MaKhoi, MaNgChng, BacDaoTao, HeDaoTao, MaDV, HocKyVao } = req.body;

        // Kiểm tra nếu MaKhoi đã tồn tại
        const existing = await ChuongTrinh.findOne({ MaKhoi });
        if (existing) {
            return res.render('chuongtrinh', { message: '❗ Mã khối đã tồn tại!' });
        }

        const newCT = new ChuongTrinh({
            MaKhoi, MaNgChng, BacDaoTao, HeDaoTao, MaDV, HocKyVao
        });

        await newCT.save();
        res.render('chuongtrinh', { message: '✅ Đã lưu chương trình mới!' });
    } catch (err) {
        console.error(err);
        res.render('chuongtrinh', { message: '❌ Lỗi khi lưu chương trình.' });
    }
};
