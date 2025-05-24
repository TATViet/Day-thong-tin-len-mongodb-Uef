// middleware/upload.js
const multer = require('multer');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './temp'); // Lưu vào thư mục temp
  },
  filename: function (req, file, cb) {
    cb(null, 'import-' + Date.now() + '.xlsx');
  }
});

// Tạo middleware upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB limit để xử lý file lớn
  },
  fileFilter: function (req, file, cb) {
    // Chấp nhận file Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'), false);
    }
  }
});

module.exports = upload;