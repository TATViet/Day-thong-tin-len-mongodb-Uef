const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Import consolidated routes
const allRoutes = require('./routes/allRoutes');

dotenv.config();
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Handle multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.render('allforms', { 
      message: `❌ Lỗi upload file: ${err.message}`, 
      activeTab: 'importData' 
    });
  } else if (err) {
    // An unknown error occurred
    return res.render('allforms', { 
      message: `❌ Lỗi: ${err.message}`, 
      activeTab: 'importData' 
    });
  }
  next();
});





// const XLSX = require('xlsx');

// // Đường dẫn tới file XLSX của bạn
// const filePath = '../Monhoc.xlsx';

// // Đọc file
// const workbook = XLSX.readFile(filePath);

// // Chọn sheet đầu tiên (hoặc theo tên sheet cụ thể)
// const sheetName = workbook.SheetNames[0];
// const worksheet = workbook.Sheets[sheetName];

// // Chuyển dữ liệu sheet thành dạng JSON
// const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// // Giả sử dữ liệu bắt đầu từ dòng 2 (bỏ qua header)
// // Dòng 0 là header: MaMH, TenMH, ...
// // Dòng 1 trở đi là dữ liệu
// for (let i = 1; i < data.length; i++) {
//     const row = data[i];
//     const MaMH = row[0];
//     const TenMH = row[1];
//     const SoTietMH = row[2];
//     const SoTinChi = row[3];
//     const MaDV = row[4];

//     // In ra hoặc xử lý các biến như ý muốn
//     console.log({ MaMH, TenMH, SoTietMH, SoTinChi, MaDV });

//     // Nếu muốn tạo câu SQL
//     const sql = `INSERT INTO Edu_Insight_MonHoc (MaMH, TenMH, SoTietMH, SoTinChi, MaDV) VALUES ('${MaMH}', N'${TenMH}', ${SoTietMH}, ${SoTinChi}, '${MaDV}');`;
//     console.log(sql);
// }



const uri = 'mongodb://0.0.0.0:27017/dbconect';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Đã kết nối MongoDB thành công!'))
.catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));



// Use the consolidated routes
app.use('/', allRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));