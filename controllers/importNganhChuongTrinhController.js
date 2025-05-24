// controllers/importNganhChuongTrinhController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const NganhChuongTrinh = require('../models/ChuongTrinh');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file Ngành Chương Trình: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);

        // Chọn sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành dạng JSON, header là dòng đầu tiên
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file Ngành Chương Trình`);

        // Biến đếm
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Kiểm tra xem header có phù hợp không
        if (data.length > 0) {
            const header = data[0];
            console.log('Header:', header);

            // Kiểm tra header có đúng không
            if (header[0] !== 'MaNgChng' || header[1] !== 'TenNgChng') {
                console.log('Header không khớp với cấu trúc mong đợi');
            }
        }

        // Xử lý từng dòng bắt đầu từ dòng 1 (bỏ qua header)
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];

                // Bỏ qua dòng trống
                if (!row || row.length < 2 || !row[0]) {
                    continue;
                }

                const MaNgChng = row[0].toString();
                const TenNgChng = row[1] ? row[1].toString() : '';

                console.log(`Đang xử lý dòng ${i+1}:`, { MaNgChng, TenNgChng });

                // Kiểm tra xem ngành chương trình đã tồn tại chưa
                const existing = await NganhChuongTrinh.findOne({ MaNgChng });

                if (existing) {
                    // Cập nhật ngành chương trình hiện tại
                    existing.TenNgChng = TenNgChng;
                    await existing.save();
                    console.log(`Đã cập nhật ngành: ${MaNgChng}`);
                } else {
                    // Tạo ngành chương trình mới
                    const newNganhChuongTrinh = new NganhChuongTrinh({
                        MaNgChng,
                        TenNgChng
                    });
                    await newNganhChuongTrinh.save();
                    console.log(`Đã tạo mới ngành: ${MaNgChng}`);
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
        let message = `✅ Đã import thành công ${successCount} ngành chương trình.`;
        if (errorCount > 0) {
            message += ` ❌ Có ${errorCount} lỗi.`;
            if (errors.length > 0) {
                message += ` Chi tiết: ${errors.slice(0, 5).join('; ')}${errors.length > 5 ? '...' : ''}`;
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
            message: `❌ Lỗi khi import dữ liệu ngành chương trình: ${err.message}`,
            activeTab: 'importData'
        });
    }
};