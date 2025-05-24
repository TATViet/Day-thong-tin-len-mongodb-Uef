// controllers/importMonHocController.js
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const MonHoc = require('../models/MonHoc');
const MonHocController = require('./MonHocController');

exports.importFromExcel = async (req, res) => {
    try {
        // Save uploaded file to a temporary location
        if (!req.file) {
            return res.render('allforms', { message: '❌ Không có file được tải lên.', activeTab: 'importData' });
        }
        
        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)){
            fs.mkdirSync(tempDir);
        }
        
        // Save the file temporarily
        const filePath = path.join(tempDir, 'tempMonHoc.xlsx');
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet data to JSON
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let successCount = 0;
        let errorCount = 0;
        let errors = [];
        
        // Process data starting from row 2 (index 1)
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];
                
                // Skip empty rows
                if (!row || row.length < 5 || !row[0]) continue;
                
                const monHocData = {
                    MaMH: row[0].toString(),
                    TenMH: row[1] ? row[1].toString() : '',
                    SoTietMH: row[2] ? Number(row[2]) : 0,
                    SoTinChi: row[3] ? Number(row[3]) : 0,
                    MaDV: row[4] ? row[4].toString() : ''
                };
                
                // Check if the record already exists
                const existing = await MonHoc.findOne({ MaMH: monHocData.MaMH });
                
                if (existing) {
                    // Update existing record
                    existing.TenMH = monHocData.TenMH;
                    existing.SoTietMH = monHocData.SoTietMH;
                    existing.SoTinChi = monHocData.SoTinChi;
                    existing.MaDV = monHocData.MaDV;
                    await existing.save();
                } else {
                    // Create a new record using MonHocController
                    const newMonHoc = new MonHoc(monHocData);
                    await newMonHoc.save();
                }
                
                successCount++;
            } catch (err) {
                errorCount++;
                errors.push(`Lỗi dòng ${i+1}: ${err.message}`);
                console.error(`Lỗi nhập dữ liệu dòng ${i+1}:`, err);
            }
        }
        
        // Clean up - delete temporary file
        fs.unlinkSync(filePath);
        
        // Generate message
        let message = `✅ Đã nhập thành công ${successCount} môn học.`;
        if (errorCount > 0) {
            message += ` ❌ Có ${errorCount} lỗi: ${errors.join('; ')}`;
        }
        
        res.render('allforms', { message, activeTab: 'importData' });
    } catch (err) {
        console.error('Lỗi khi import:', err);
        res.render('allforms', { message: `❌ Lỗi khi nhập dữ liệu: ${err.message}`, activeTab: 'importData' });
    }
};