// controllers/importTyTrongChuanController.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const TyTrongChuan = require('../models/TyTrongChuan');

exports.importFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }

        const filePath = req.file.path;
        console.log(`Bắt đầu xử lý file Tỷ Trọng Chuẩn: ${filePath}`);

        // Đọc file Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        console.log(`Đã đọc ${data.length} dòng từ file Tỷ Trọng Chuẩn`);
        console.log('Dữ liệu thô 5 dòng đầu:', data.slice(0, 5));

        // Biến đếm
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // Kiểm tra dữ liệu (cần ít nhất 4 dòng: 2 dòng bỏ + header + 1 dòng dữ liệu)
        if (!data || data.length < 4) {
            fs.unlinkSync(filePath);
            return res.render('allforms', {
                message: '❌ File không có đủ dữ liệu. Cần ít nhất 1 dòng PLO.',
                activeTab: 'importData'
            });
        }

        // Bỏ 2 dòng đầu, dòng thứ 3 (index 2) là header thực sự
        const headers = data[2]; // Dòng thứ 3 là header: [rỗng, HK1/1, HK2/1, ..., Điểm chọn]
        const namHKList = headers.slice(1, -1); // Bỏ cột đầu (PLO) và cột cuối (Điểm chọn)
        
        console.log('Header (dòng 3):', headers);
        console.log('Danh sách NamHK:', namHKList);

        // Lấy DiemChon từ dòng đầu tiên có dữ liệu PLO (dòng thứ 4, index 3)
        let diemChon = 5.5; // Mặc định
        if (data.length > 3) {
            const firstDataRow = data[3]; // PLO 1
            if (firstDataRow && firstDataRow.length > 0) {
                const lastValue = firstDataRow[firstDataRow.length - 1];
                if (lastValue && !isNaN(parseFloat(lastValue))) {
                    diemChon = parseFloat(lastValue);
                }
            }
        }
        
        // Đếm số PLO (từ dòng 4 trở đi)
        const soPLO = data.length - 3; // Trừ 2 dòng đầu bỏ qua + 1 dòng header
        
        console.log(`Số PLO: ${soPLO}, Điểm chọn: ${diemChon}`);

        // Xử lý dữ liệu PLO (bắt đầu từ dòng 4, index 3)
        const ploDataArray = [];
        
        for (let i = 3; i < data.length; i++) { // Bắt đầu từ dòng thứ 4
            try {
                const row = data[i];
                const ploName = row[0]; // "PLO 1", "PLO 2", etc.
                
                if (!ploName) {
                    console.log(`Bỏ qua dòng ${i+1}: Không có tên PLO`);
                    continue;
                }
                
                const tyTrongArray = [];
                
                // Xử lý từng cột tỷ trọng (bỏ cột đầu và cột cuối)
                for (let j = 1; j < row.length - 1; j++) {
                    const namHK = namHKList[j - 1];
                    let giaTri = row[j];
                    
                    // Xử lý giá trị
                    if (typeof giaTri === 'string') {
                        giaTri = giaTri.replace('%', ''); // Bỏ dấu %
                        giaTri = parseFloat(giaTri) || 0;
                    } else if (typeof giaTri === 'number') {
                        // Nếu là số thập phân (0.25 → 25%)
                        if (giaTri > 0 && giaTri <= 1) {
                            giaTri = giaTri * 100;
                        }
                    } else {
                        giaTri = 0;
                    }
                    
                    if (namHK) { // Chỉ thêm nếu có tên học kỳ
                        tyTrongArray.push({
                            NamHK: namHK,
                            GiaTri: giaTri
                        });
                    }
                }
                
                ploDataArray.push({
                    PLO: ploName,
                    TyTrong: tyTrongArray
                });

                console.log(`Đã xử lý ${ploName} với ${tyTrongArray.length} học kỳ`);
                
            } catch (err) {
                errorCount++;
                errors.push(`Lỗi dòng ${i+1}: ${err.message}`);
                console.error(`Lỗi xử lý dòng ${i+1}:`, err);
            }
        }

        // Tạo document mới
        const tyTrongChuanDoc = new TyTrongChuan({
            SoPLO: soPLO,
            DiemChon: diemChon,
            PLOData: ploDataArray
        });

        // Lưu vào database
        await tyTrongChuanDoc.save();
        successCount = ploDataArray.length;

        console.log(`✅ Đã lưu thành công ${successCount} PLO`);

        // Xóa file tạm
        fs.unlinkSync(filePath);

        // Tạo thông báo kết quả
        let message = `✅ Đã import thành công bảng tỷ trọng chuẩn với ${soPLO} PLO và điểm chọn ${diemChon}.`;
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
            message: `❌ Lỗi khi import dữ liệu tỷ trọng chuẩn: ${err.message}`,
            activeTab: 'importData'
        });
    }
};