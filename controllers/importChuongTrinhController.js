// controllers/importChuongTrinhController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ChuongTrinh = require('../models/ChuongTrinh');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file Chương Trình: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);

        // Chọn sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành dạng JSON, header là dòng đầu tiên
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file Chương Trình`);

        // Biến đếm
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Kiểm tra dữ liệu header
        if (data.length > 0) {
            const header = data[0];
            console.log('Header:', header);
        }

        // Xử lý từng dòng bắt đầu từ dòng 1 (bỏ qua header)
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];

                // Bỏ qua dòng trống
                if (!row || row.length < 6 || !row[0]) {
                    continue;
                }

                // Trích xuất dữ liệu từ hàng
                const MaKhoi = row[0] ? row[0].toString() : '';
                const MaNgChng = row[1] ? row[1].toString() : '';
                const BacDaoTao = row[2] ? row[2].toString() : '';
                const HeDaoTao = row[3] ? row[3].toString() : '';
                const MaDV = row[4] ? row[4].toString() : '';
                const DiemChon = row[6] ? row [6].toString() :'';
                let HocKyVao = null;

                // Chuyển đổi HocKyVao thành số nếu có giá trị
                if (row[5] !== undefined && row[5] !== null) {
                    if (typeof row[5] === 'number') {
                        HocKyVao = row[5];
                    } else if (typeof row[5] === 'string' && row[5].trim() !== '') {
                        HocKyVao = Number(row[5]);
                        if (isNaN(HocKyVao)) {
                            HocKyVao = null;
                        }
                    }
                }

                console.log(`Đang xử lý dòng ${i+1}:`, {
                    MaKhoi, MaNgChng, BacDaoTao, HeDaoTao, MaDV, HocKyVao
                });

                // Kiểm tra xem chương trình đã tồn tại chưa
                const existing = await ChuongTrinh.findOne({ MaKhoi });

                if (existing) {
                    // Cập nhật chương trình hiện tại
                    existing.MaNgChng = MaNgChng;
                    existing.BacDaoTao = BacDaoTao;
                    existing.HeDaoTao = HeDaoTao;
                    existing.MaDV = MaDV;
                    existing.DiemChon = DiemChon;
                    if (HocKyVao !== null) {
                        existing.HocKyVao = HocKyVao;
                    }
                    await existing.save();
                    console.log(`Đã cập nhật chương trình: ${MaKhoi}`);
                } else {
                    // Tạo chương trình mới
                    const newChuongTrinh = new ChuongTrinh({
                        MaKhoi,
                        MaNgChng,
                        BacDaoTao,
                        HeDaoTao,
                        MaDV,
                        DiemChon,
                        ...(HocKyVao !== null && { HocKyVao })
                    });
                    await newChuongTrinh.save();
                    console.log(`Đã tạo mới chương trình: ${MaKhoi}`);
                }

                successCount++;
            } catch (err) {
                errorCount++;
                errors.push(`Lỗi dòng ${i+1}: ${err.message}`);
                console.error(`Lỗi xử lý dòng ${i+1}:`, err);
            }
        }

        // Xóa file tạm sau khi xử lý
        fs.unlinkSync(filePath);

        // Tạo thông báo kết quả
        let message = `✅ Đã import thành công ${successCount} chương trình.`;
        if (errorCount > 0) {
            message += ` ❌ Có ${errorCount} lỗi.`;
            if (errors.length > 0) {
                message += ` Chi tiết: ${errors.slice(0, 6).join('; ')}${errors.length > 6 ? '...' : ''}`;
            }
        }

        return res.render('allforms', { message, activeTab: 'importData' });
    } catch (err) {
        console.error('Lỗi tổng thể:', err);

        // Xóa file nếu có lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.render('allforms', {
            message: `❌ Lỗi khi import dữ liệu chương trình: ${err.message}`,
            activeTab: 'importData'
        });
    }
};