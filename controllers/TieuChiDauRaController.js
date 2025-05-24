// controllers/tieuChiDauRaController.js
const TieuChiDauRa = require('../models/TieuChiDauRa');

exports.save = async (req, res) => {
    try {
        const { MaTieuChi, MaKhoi, MaNgChng, MaDV, NhomPLO, MaPLO, NoiDungTieuChi } = req.body;

        // Kiểm tra nếu MaTieuChi đã tồn tại
        const existing = await TieuChiDauRa.findOne({ MaTieuChi });
        if (existing) {
            return res.render('allforms', { message: '❗ Mã tiêu chí đã tồn tại!', activeTab: 'tieuChiDauRa' });
        }

        const newTCDR = new TieuChiDauRa({
            MaTieuChi, MaKhoi, MaNgChng, MaDV, NhomPLO, MaPLO, NoiDungTieuChi
        });

        await newTCDR.save();
        res.render('allforms', { message: '✅ Đã lưu tiêu chí đầu ra mới!', activeTab: 'tieuChiDauRa' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu tiêu chí đầu ra.', activeTab: 'tieuChiDauRa' });
    }
};