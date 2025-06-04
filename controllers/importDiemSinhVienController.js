// controllers/importDiemSinhVienController.js
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const DiemSinhVien = require('../models/DiemSinhVien'); // Đảm bảo đường dẫn đến model đúng
const mongoose = require('mongoose');

// Đường dẫn thư mục tạm
const tempDir = path.join(__dirname, '../temp');

// Đảm bảo thư mục tạm tồn tại
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Đọc và xử lý file Excel với xử lý phân lô
exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;

        // Bạn có thể thay đổi dòng bắt đầu nếu cần
        const startRow = 1; // Bắt đầu từ dòng 1 (sau header)

        console.log(`Bắt đầu xử lý file điểm sinh viên: ${filePath}, từ dòng ${startRow}`);

        // Đọc toàn bộ workbook
        console.time('Đọc file Excel');
        const workbook = XLSX.readFile(filePath);
        console.timeEnd('Đọc file Excel');

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Chuyển sheet thành JSON
        console.time('Chuyển sheet thành JSON');
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.timeEnd('Chuyển sheet thành JSON');

        const totalRows = data.length - 1; // Trừ header
        console.log(`Tổng số dòng (không bao gồm header): ${totalRows}`);

        if (startRow > totalRows) {
            fs.unlinkSync(filePath);
            return res.render('allforms', {
                message: `❌ Dòng bắt đầu (${startRow}) lớn hơn tổng số dòng (${totalRows}).`,
                activeTab: 'importData'
            });
        }

        // Khai báo thống kê
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Cấu hình kích thước batch và số lượng batch xử lý song song
        const BATCH_SIZE = 1000; // Số lượng bản ghi trong một batch
        const MAX_CONCURRENT_BATCHES = 5; // Số lượng batch xử lý song song tối đa

        // Hàm chuyển đổi dữ liệu thô thành đối tượng DiemSinhVien
        // Hàm chuyển đổi dữ liệu thô thành đối tượng DiemSinhVien
        const convertRowToDiemSinhVien = (row) => {
            // Bỏ qua dòng trống
            if (!row || row.length < 8 || !row[0] || !row[1] || !row[2]) return null;

            // Hàm helper để xử lý điểm số
            const processScore = (value) => {
                // Nếu undefined hoặc null
                if (value === undefined || value === null) return '0';
                
                // Chuyển thành string và trim
                const stringValue = String(value).trim();
                
                // Nếu rỗng hoặc "V" hoặc "v" (không phân biệt hoa thường)
                if (stringValue === '' || stringValue.toLowerCase() === 'v') {
                    return '0';
                }
                
                // Trả về giá trị gốc (đã trim)
                return stringValue;
            };

            // Mặc định NamHK là năm hiện tại nếu không có
            let namHK = new Date().getFullYear();
            if (row[9] !== undefined) {
                if (typeof row[9] === 'number') {
                    namHK = row[9];
                } else if (typeof row[9] === 'string' && row[9].trim() !== '') {
                    namHK = Number(row[9]);
                    if (isNaN(namHK)) {
                        namHK = new Date().getFullYear();
                    }
                }
            }

            // Trả về đối tượng với điểm số đã được xử lý
            return {
                MaSV: String(row[0]),
                MaMH: String(row[1]),
                NhomHoc: String(row[2]),
                NamHK: namHK,
                updateData: {
                    MaSV: String(row[0]),
                    MaMH: String(row[1]),
                    NhomHoc: String(row[2]),
                    QuaTrinh: processScore(row[3]),      // SỬ DỤNG processScore
                    GiuaKy: processScore(row[4]),        // SỬ DỤNG processScore
                    CuoiKy: processScore(row[5]),        // SỬ DỤNG processScore
                    DiemHP: processScore(row[6]),        // SỬ DỤNG processScore
                    DiemSoHP: processScore(row[7]),      // SỬ DỤNG processScore
                    DiemChuHP: processScore(row[8]),     // SỬ DỤNG processScore
                    NamHK: namHK
                }
            };
        };

        // Hàm xử lý một batch dữ liệu
        const processBatch = async (batchData, batchIndex) => {
            console.log(`Bắt đầu xử lý batch ${batchIndex} với ${batchData.length} dòng`);

            try {
                // Chuẩn bị danh sách các thao tác bulkWrite
                const bulkOps = [];

                // Chuyển đổi các dòng dữ liệu thành thao tác bulkWrite
                for (const item of batchData) {
                    if (item === null) continue;

                    bulkOps.push({
                        updateOne: {
                            filter: {
                                MaSV: item.MaSV,
                                MaMH: item.MaMH,
                                NhomHoc: item.NhomHoc,
                                NamHK: item.NamHK
                            },
                            update: { $set: item.updateData },
                            upsert: true
                        }
                    });
                }

                // Kiểm tra nếu có thao tác để thực hiện
                if (bulkOps.length === 0) {
                    console.log(`Batch ${batchIndex}: Không có dữ liệu hợp lệ`);
                    return { upsertedCount: 0, modifiedCount: 0 };
                }

                // Thực hiện bulkWrite
                console.time(`Batch ${batchIndex} - bulkWrite`);
                // *** ĐÂY LÀ CHỖ BỊ LỖI *** 
                // Sửa từ HienDienSV thành DiemSinhVien
                const result = await DiemSinhVien.bulkWrite(bulkOps, { ordered: false });
                console.timeEnd(`Batch ${batchIndex} - bulkWrite`);

                console.log(`Batch ${batchIndex} hoàn thành: Thêm mới ${result.upsertedCount || 0}, Cập nhật ${result.modifiedCount || 0}`);

                return {
                    upsertedCount: result.upsertedCount || 0,
                    modifiedCount: result.modifiedCount || 0
                };
            } catch (err) {
                console.error(`Lỗi xử lý batch ${batchIndex}:`, err);
                throw err;
            }
        };

        console.time('Xử lý dữ liệu');

        // Tính toán vị trí bắt đầu trong mảng (dòng 1 trong Excel = phần tử 1 trong mảng data)
        // Nhưng mảng data bắt đầu từ 0 và dòng 0 là header
        const startIndex = startRow;

        console.log(`Xử lý từ dòng ${startRow} đến cuối (chỉ số mảng ${startIndex})`);

        // Lấy phần dữ liệu cần xử lý, bắt đầu từ startIndex đến cuối
        const dataToProcess = data.slice(startIndex);

        // Chuyển đổi tất cả dòng dữ liệu trước khi chia batch
        console.time('Chuyển đổi dữ liệu');
        const convertedData = dataToProcess.map(convertRowToDiemSinhVien);
        console.timeEnd('Chuyển đổi dữ liệu');

        // Chia dữ liệu thành các batch
        const batches = [];
        for (let i = 0; i < convertedData.length; i += BATCH_SIZE) {
            batches.push(convertedData.slice(i, i + BATCH_SIZE));
        }

        console.log(`Đã chia thành ${batches.length} batch, mỗi batch tối đa ${BATCH_SIZE} bản ghi`);

        // Xử lý các batch theo lô với Promise.all và giới hạn số lượng xử lý song song
        const processBatchesInChunks = async () => {
            let processedBatches = 0;
            let totalSuccess = 0;

            // Xử lý theo từng nhóm batch song song
            for (let i = 0; i < batches.length; i += MAX_CONCURRENT_BATCHES) {
                const currentBatches = batches.slice(i, i + MAX_CONCURRENT_BATCHES);
                const batchPromises = currentBatches.map((batch, index) =>
                    processBatch(batch, i + index + 1)
                );

                try {
                    console.log(`Đang xử lý nhóm batch ${Math.floor(i / MAX_CONCURRENT_BATCHES) + 1}/${Math.ceil(batches.length / MAX_CONCURRENT_BATCHES)}`);
                    const batchResults = await Promise.all(batchPromises);

                    for (const result of batchResults) {
                        totalSuccess += result.upsertedCount + result.modifiedCount;
                    }

                    processedBatches += currentBatches.length;

                    // Tính phần trăm hoàn thành dựa trên số batch đã xử lý
                    const percentComplete = Math.round((processedBatches / batches.length) * 100);
                    console.log(`Đã xử lý ${processedBatches}/${batches.length} batch (${percentComplete}%), thành công: ${totalSuccess} bản ghi`);
                } catch (err) {
                    console.error(`Lỗi khi xử lý nhóm batch:`, err);
                    errorCount++;
                    errors.push(`Lỗi xử lý nhóm batch: ${err.message}`);
                }
            }

            return totalSuccess;
        };

        // Thực hiện xử lý
        successCount = await processBatchesInChunks();

        console.timeEnd('Xử lý dữ liệu');

        // Xóa file tạm
        fs.unlinkSync(filePath);

        // Tính số dòng đã xử lý
        const processedRowCount = dataToProcess.length;

        // Tạo thông báo kết quả
        let message = `✅ Đã import thành công ${successCount} điểm sinh viên từ ${processedRowCount} dòng dữ liệu`;
        message += ` (bắt đầu từ dòng ${startRow}).`;

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
            message: `❌ Lỗi khi import dữ liệu điểm sinh viên: ${err.message}`,
            activeTab: 'importData'
        });
    }
};