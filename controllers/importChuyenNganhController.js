// controllers/importChuyenNganhController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const ChuyenNganh = require('../models/ChuyenNganh');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file ChuyenNganh: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);

        // Chọn sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành dạng JSON, header là dòng đầu tiên
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file ChuyenNganh`);

        // Biến đếm
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Xử lý từng dòng bắt đầu từ dòng 1 (bỏ qua header)
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];

                // Bỏ qua dòng trống
                if (!row || row.length < 3 || !row[0]) {
                    continue;
                }

                const MaCN = row[0].toString();
                const TenCN = row[1] ? row[1].toString() : '';
                //const MaDV = row[2] ? row[2].toString() : '';

                console.log(`Đang xử lý dòng ${i+1}:`, { MaCN, TenCN });

                // Kiểm tra xem chuyên ngành đã tồn tại chưa
                const existing = await ChuyenNganh.findOne({ MaCN });

                if (existing) {
                    // Cập nhật chuyên ngành hiện tại
                    existing.TenCN = TenCN;
                    //existing.MaDV = MaDV;
                    await existing.save();
                } else {
                    // Tạo chuyên ngành mới
                    const newChuyenNganh = new ChuyenNganh({
                        MaCN,
                        TenCN,
                        //MaDV
                    });
                    await newChuyenNganh.save();
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
        let message = `✅ Đã import thành công ${successCount} chuyên ngành.`;
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
            message: `❌ Lỗi khi import dữ liệu chuyên ngành: ${err.message}`,
            activeTab: 'importData'
        });
    }
};