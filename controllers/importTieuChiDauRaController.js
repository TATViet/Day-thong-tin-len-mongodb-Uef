// controllers/importTieuChiDauRaController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const TieuChiDauRa = require('../models/TieuChiDauRa');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file Tiêu Chí Đầu Ra: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);

        // Chọn sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành dạng JSON, header là dòng đầu tiên
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file Tiêu Chí Đầu Ra`);

        // Biến đếm
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Kiểm tra và xử lý header
        if (data.length === 0) {
            fs.unlinkSync(filePath);
            return res.render('allforms', {
                message: '❌ File không có dữ liệu.',
                activeTab: 'importData'
            });
        }

        const headers = data[0];
        console.log('Header:', headers);

        // Xác định các vị trí cột dựa vào header
        const headerMap = {};
        headers.forEach((header, index) => {
            headerMap[header] = index;
        });

        console.log('Header Map:', headerMap);

        // Kiểm tra xem có đủ các cột cần thiết không
        const requiredColumns = ['MaTieuChi', 'MaKhoi', 'MaNgChng', 'MaDV', 'NhomTieuChi', 'MaPLO', 'NoiDungTieuChi'];
        const missingColumns = requiredColumns.filter(col => !headerMap.hasOwnProperty(col));

        if (missingColumns.length > 0) {
            console.log('Missing columns:', missingColumns);
            // Nếu thiếu cột, có thể map tên cột với các tên tương đương
            // Ví dụ: 'NhomPLO' có thể là 'NhomTieuChi', 'NoidungPLO' có thể là 'NoiDungTieuChi'
            if (headerMap.hasOwnProperty('NhomPLO')) headerMap['NhomTieuChi'] = headerMap['NhomPLO'];
            if (headerMap.hasOwnProperty('NoidungPLO')) headerMap['NoiDungTieuChi'] = headerMap['NoidungPLO'];
        }

        // Xử lý từng dòng bắt đầu từ dòng 1 (bỏ qua header)
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];

                // Bỏ qua dòng trống
                if (!row || row.length === 0) {
                    continue;
                }

                // Tạo đối tượng dữ liệu từ dòng, sử dụng headerMap
                const tieuChiData = {};

                // Lấy giá trị từ hàng dựa trên vị trí của header
                for (const [header, index] of Object.entries(headerMap)) {
                    if (row[index] !== undefined) {
                        // Chuyển đổi giá trị thành chuỗi nếu không phải undefined
                        tieuChiData[header] = row[index] !== null ? row[index].toString() : '';
                    }
                }

                // Đảm bảo có MaTieuChi
                if (!tieuChiData.MaTieuChi) {
                    console.log(`Bỏ qua dòng ${i+1}: Không có MaTieuChi`);
                    continue;
                }

                // Map dữ liệu vào model
                const tieuChiRecord = {
                    MaTieuChi: tieuChiData.MaTieuChi,
                    MaKhoi: tieuChiData.MaKhoi || '',
                    MaNgChng: tieuChiData.MaNgChng || '',
                    MaDV: tieuChiData.MaDV || '',
                    NhomTieuChi: tieuChiData.NhomTieuChi || tieuChiData.NhomPLO || '',
                    MaPLO: tieuChiData.MaPLO || '',
                    NoiDungTieuChi: tieuChiData.NoiDungTieuChi || tieuChiData.NoidungPLO || ''
                };

                console.log(`Đang xử lý dòng ${i+1}:`, tieuChiRecord);

                // Kiểm tra xem tiêu chí đã tồn tại chưa
                const existing = await TieuChiDauRa.findOne({ MaTieuChi: tieuChiRecord.MaTieuChi });

                if (existing) {
                    // Cập nhật tiêu chí hiện tại
                    existing.MaKhoi = tieuChiRecord.MaKhoi;
                    existing.MaNgChng = tieuChiRecord.MaNgChng;
                    existing.MaDV = tieuChiRecord.MaDV;
                    existing.NhomTieuChi = tieuChiRecord.NhomTieuChi;
                    existing.MaPLO = tieuChiRecord.MaPLO;
                    existing.NoiDungTieuChi = tieuChiRecord.NoiDungTieuChi;
                    await existing.save();
                    console.log(`Đã cập nhật tiêu chí: ${tieuChiRecord.MaTieuChi}`);
                } else {
                    // Tạo tiêu chí mới
                    const newTieuChi = new TieuChiDauRa(tieuChiRecord);
                    await newTieuChi.save();
                    console.log(`Đã tạo mới tiêu chí: ${tieuChiRecord.MaTieuChi}`);
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
        let message = `✅ Đã import thành công ${successCount} tiêu chí đầu ra.`;
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
            message: `❌ Lỗi khi import dữ liệu tiêu chí đầu ra: ${err.message}`,
            activeTab: 'importData'
        });
    }
};