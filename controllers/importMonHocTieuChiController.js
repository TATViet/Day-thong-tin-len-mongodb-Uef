// controllers/importMonHocTieuChiController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const MonHocTieuChi = require('../models/MonHocTieuChi');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file Môn Học Tiêu Chí: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);

        // Chọn sheet đầu tiên
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành dạng JSON, header là dòng đầu tiên
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file Môn Học Tiêu Chí`);

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
        const requiredColumns = ['MaTieuChi', 'MaMH'];
        const missingColumns = requiredColumns.filter(col => !headerMap.hasOwnProperty(col));

        if (missingColumns.length > 0) {
            console.log('Missing required columns:', missingColumns);
            fs.unlinkSync(filePath);
            return res.render('allforms', {
                message: `❌ File thiếu các cột bắt buộc: ${missingColumns.join(', ')}.`,
                activeTab: 'importData'
            });
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
                const monHocTieuChiData = {};

                // Trích xuất dữ liệu từ các cột theo header
                for (const [header, index] of Object.entries(headerMap)) {
                    if (index < row.length && row[index] !== undefined) {
                        monHocTieuChiData[header] = row[index];
                    }
                }

                // Kiểm tra dữ liệu bắt buộc
                if (!monHocTieuChiData.MaTieuChi || !monHocTieuChiData.MaMH) {
                    console.log(`Bỏ qua dòng ${i+1}: Thiếu MaTieuChi hoặc MaMH`);
                    continue;
                }

                // Xử lý các giá trị số
                let diemChon = null;
                if (monHocTieuChiData.DiemChon !== undefined) {
                    if (typeof monHocTieuChiData.DiemChon === 'number') {
                        diemChon = monHocTieuChiData.DiemChon;
                    } else if (typeof monHocTieuChiData.DiemChon === 'string' && monHocTieuChiData.DiemChon.trim() !== '') {
                        diemChon = Number(monHocTieuChiData.DiemChon);
                        if (isNaN(diemChon)) {
                            diemChon = null;
                        }
                    }
                }

                let trongSo = null;
                if (monHocTieuChiData.TrongSo !== undefined) {
                    if (typeof monHocTieuChiData.TrongSo === 'number') {
                        trongSo = monHocTieuChiData.TrongSo;
                    } else if (typeof monHocTieuChiData.TrongSo === 'string' && monHocTieuChiData.TrongSo.trim() !== '') {
                        trongSo = Number(monHocTieuChiData.TrongSo);
                        if (isNaN(trongSo)) {
                            trongSo = null;
                        }
                    }
                }

                // Chuẩn bị đối tượng dữ liệu để lưu
                const monHocTieuChiRecord = {
                    MaTieuChi: monHocTieuChiData.MaTieuChi.toString(),
                    MaMH: monHocTieuChiData.MaMH.toString(),
                    LoaiDiem: monHocTieuChiData.LoaiDiem ? monHocTieuChiData.LoaiDiem.toString() : '',
                    ...(diemChon !== null && { DiemChon: diemChon }),
                    ...(trongSo !== null && { TrongSo: trongSo })
                };

                console.log(`Đang xử lý dòng ${i+1}:`, monHocTieuChiRecord);

                // Kiểm tra xem bản ghi đã tồn tại chưa dựa trên composite key
                const existing = await MonHocTieuChi.findOne({
                    MaTieuChi: monHocTieuChiRecord.MaTieuChi,
                    MaMH: monHocTieuChiRecord.MaMH
                });

                if (existing) {
                    // Cập nhật bản ghi hiện tại
                    existing.LoaiDiem = monHocTieuChiRecord.LoaiDiem;
                    if (diemChon !== null) existing.DiemChon = diemChon;
                    if (trongSo !== null) existing.TrongSo = trongSo;
                    await existing.save();
                    console.log(`Đã cập nhật môn học tiêu chí: ${monHocTieuChiRecord.MaTieuChi} - ${monHocTieuChiRecord.MaMH}`);
                } else {
                    // Tạo bản ghi mới
                    const newMonHocTieuChi = new MonHocTieuChi(monHocTieuChiRecord);
                    await newMonHocTieuChi.save();
                    console.log(`Đã tạo mới môn học tiêu chí: ${monHocTieuChiRecord.MaTieuChi} - ${monHocTieuChiRecord.MaMH}`);
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
        let message = `✅ Đã import thành công ${successCount} môn học tiêu chí.`;
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
            message: `❌ Lỗi khi import dữ liệu môn học tiêu chí: ${err.message}`,
            activeTab: 'importData'
        });
    }
};