// routes/allRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import all controllers - using exact case matching to your files
const chuongTrinhController = require('../controllers/chuongTrinhController');
const ChuyenNganhController = require('../controllers/ChuyenNganhController');
const DiemSinhVienController = require('../controllers/DiemSinhVienController');
const DonViController = require('../controllers/DonViController');
const HienDienSVController = require('../controllers/HienDienSVController');
const MonHocController = require('../controllers/MonHocController');
const MonHocTieuChiController = require('../controllers/MonHocTieuChiController');
const TieuChiDauRaController = require('../controllers/TieuChiDauRaController');
const TinhDiemTieuChiController = require('../controllers/TinhDiemTieuChiController');
// const importController = require('../controllers/importController');
const upload = require('../middleware/upload.js');
const importMonHocController = require('../controllers/importMonHocController');
const importHienDienSVController = require('../controllers/importHienDienSVController');
const importDonViController = require('../controllers/importDonViController');
const importChuyenNganhController = require('../controllers/importChuyenNganhController');
const importNganhChuongTrinhController = require('../controllers/importNganhChuongTrinhController');
const importChuongTrinhController = require('../controllers/importChuongTrinhController');
const importTieuChiDauRaController = require('../controllers/importTieuChiDauRaController');
const importMonHocTieuChiController = require('../controllers/importMonHocTieuChiController');
const importDiemSinhVienController = require('../controllers/importDiemSinhVienController');
const updateDiemChonController = require('../controllers/updateDiemChonController');
const TyTrongChuan = require('../controllers/importTyTrongChuanController.js');


// Main route for all forms
router.get('/', (req, res) => {
    res.render('allforms', { message: null, activeTab: 'chuongTrinh' });
});

// Chương Trình routes
router.get('/chuongtrinh', chuongTrinhController.form);
router.post('/chuongtrinh/save', chuongTrinhController.save);

// Chuyên Ngành routes
router.post('/chuyennganh/save', ChuyenNganhController.save);

// Điểm Sinh Viên routes
router.post('/diemsinhvien/save', DiemSinhVienController.save);

// Đơn Vị routes
router.post('/donvi/save', DonViController.save);

// Hiện Diện SV routes
router.post('/hiendiensv/save', HienDienSVController.save);

// Môn Học routes
router.post('/monhoc/save', MonHocController.save);

// Môn Học Tiêu Chí routes
router.post('/monhoctieuchi/save', MonHocTieuChiController.save);

// Tiêu Chí Đầu Ra routes
router.post('/tieuchidaura/save', TieuChiDauRaController.save);

// Tính Điểm Tiêu Chí routes
router.post('/tinhdiemtieuchi/save', TinhDiemTieuChiController.save);

// Route để cập nhật DiemChon từ ChuongTrinh
router.post('/update-diem-chon', updateDiemChonController.updateDiemChonFromChuongTrinh);

// Import routes
// router.post('/import/hiendiensv', upload.single('excelFile'), importController.importHienDienSV);
//router.post('/import/donvi', upload.single('excelFile'), importController.importDonVi);
//router.post('/import/chuyennganh', upload.single('excelFile'), importController.importChuyenNganh);
//router.post('/import/chuongtrinh', upload.single('excelFile'), importController.importChuongTrinh);
//router.post('/import/tieuchidaura', upload.single('excelFile'), importController.importTieuChiDauRa);
//router.post('/import/monhoctieuchi', upload.single('excelFile'), importController.importMonHocTieuChi);

// Add to routes/allRoutes.js
// router.post('/import/monhoc', upload.single('excelFile'), importController.importMonHoc);
router.post('/import/monhoc', upload.single('excelFile'), importMonHocController.importFromExcel);
router.post('/import/hiendiensv', upload.single('excelFile'), importHienDienSVController.importFromExcel);
router.post('/import/donvi', upload.single('excelFile'), importDonViController.importFromExcel);
router.post('/import/chuyennganh', upload.single('excelFile'), importNganhChuongTrinhController.importFromExcel);
router.post('/import/chuongtrinh', upload.single('excelFile'), importChuongTrinhController.importFromExcel);
router.post('/import/tieuchidaura', upload.single('excelFile'), importTieuChiDauRaController.importFromExcel);
router.post('/import/monhoctieuchi', upload.single('excelFile'), importMonHocTieuChiController.importFromExcel);
router.post('/import/diemsinhvien', upload.single('excelFile'), importDiemSinhVienController.importFromExcel);
router.post('/import/TyTrongChuan', upload.single('excelFile'), TyTrongChuan.importFromExcel);
// routes/allRoutes.js
router.post('/debug-data-flow', updateDiemChonController.debugDataFlow);

module.exports = router;