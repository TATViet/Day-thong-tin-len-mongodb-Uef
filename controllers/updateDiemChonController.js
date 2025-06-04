// controllers/updateDiemChonController.js
const ChuongTrinh = require('../models/ChuongTrinh');
const TieuChiDauRa = require('../models/TieuChiDauRa');
const MonHocTieuChi = require('../models/MonHocTieuChi');

exports.updateDiemChonFromChuongTrinh = async (req, res) => {
  try {
    console.log('🔄 Bắt đầu cập nhật DiemChon từ ChuongTrinh...');
    
    // Bước 1: Lấy tất cả chương trình (không filter gì cả)
    const chuongTrinhList = await ChuongTrinh.find({}).lean();
    
    if (!chuongTrinhList || chuongTrinhList.length === 0) {
      return res.render('allforms', {
        message: '❌ Không tìm thấy dữ liệu trong ChuongTrinh.',
        activeTab: 'importData'
      });
    }
    
    console.log(`📋 Tìm thấy ${chuongTrinhList.length} chương trình`);
    
    let totalUpdated = 0;
    let totalErrors = 0;
    let errors = [];
    let processedKhois = 0;
    let skippedKhois = 0;
    
    // Bước 2: Xử lý từng chương trình
    for (const chuongTrinh of chuongTrinhList) {
      try {
        const maKhoi = chuongTrinh.MaKhoi?.trim(); // Làm sạch MaKhoi
        let diemChon = chuongTrinh.DiemChon;
        
        // Kiểm tra và xử lý DiemChon
        if (diemChon === null || diemChon === undefined || diemChon === 'null') {
          console.log(`⚠️ Bỏ qua MaKhoi "${maKhoi}": DiemChon không hợp lệ (${diemChon})`);
          skippedKhois++;
          continue;
        }
        
        // Chuyển DiemChon về số nếu cần
        if (typeof diemChon === 'string') {
          diemChon = parseFloat(diemChon);
          if (isNaN(diemChon)) {
            console.log(`⚠️ Bỏ qua MaKhoi "${maKhoi}": DiemChon không thể chuyển thành số`);
            skippedKhois++;
            continue;
          }
        }
        
        console.log(`🔍 Xử lý MaKhoi: "${maKhoi}", DiemChon: ${diemChon} (type: ${typeof diemChon})`);
        
        // Bước 3: Lấy các MaTieuChi từ TieuChiDauRa theo MaKhoi
        const tieuChiDauRaList = await TieuChiDauRa.find({ MaKhoi: maKhoi }).lean();
        
        if (!tieuChiDauRaList || tieuChiDauRaList.length === 0) {
          console.log(`⚠️ Không tìm thấy tiêu chí cho MaKhoi: "${maKhoi}"`);
          skippedKhois++;
          continue;
        }
        
        // Làm sạch MaTieuChi
        const maTieuChiList = tieuChiDauRaList.map(tc => tc.MaTieuChi?.trim()).filter(tc => tc);
        console.log(`📝 Tìm thấy ${maTieuChiList.length} tiêu chí cho MaKhoi "${maKhoi}"`);
        
        // Bước 4: Cập nhật DiemChon cho tất cả MonHocTieuChi có MaTieuChi tương ứng
        let updatedForThisKhoi = 0;
        
        for (const maTieuChi of maTieuChiList) {
          try {
            // Kiểm tra xem có bản ghi nào không
            const existingCount = await MonHocTieuChi.countDocuments({ MaTieuChi: maTieuChi });
            
            if (existingCount === 0) {
              console.log(`   ⚠️ Không tìm thấy bản ghi MonHocTieuChi cho MaTieuChi: "${maTieuChi}"`);
              continue;
            }
            
            console.log(`   🔍 Tìm thấy ${existingCount} bản ghi MonHocTieuChi cho MaTieuChi: "${maTieuChi}"`);
            
            // Thực hiện update
            const updateResult = await MonHocTieuChi.updateMany(
              { MaTieuChi: maTieuChi },
              { $set: { DiemChon: diemChon } }
            );
            
            console.log(`   ✅ Kết quả update: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);
            
            updatedForThisKhoi += updateResult.modifiedCount;
            totalUpdated += updateResult.modifiedCount;
            
          } catch (updateError) {
            console.error(`❌ Lỗi cập nhật MaTieuChi "${maTieuChi}":`, updateError);
            totalErrors++;
            errors.push(`Lỗi cập nhật MaTieuChi ${maTieuChi}: ${updateError.message}`);
          }
        }
        
        console.log(`📊 MaKhoi "${maKhoi}": Đã cập nhật ${updatedForThisKhoi} bản ghi`);
        processedKhois++;
        
      } catch (processError) {
        console.error(`❌ Lỗi xử lý chương trình ${chuongTrinh.MaKhoi}:`, processError);
        totalErrors++;
        errors.push(`Lỗi xử lý chương trình ${chuongTrinh.MaKhoi}: ${processError.message}`);
      }
    }
    
    // Tạo thông báo kết quả
    let message = `✅ Hoàn thành! Đã xử lý ${processedKhois} chương trình, bỏ qua ${skippedKhois} chương trình. Tổng cộng cập nhật ${totalUpdated} bản ghi MonHocTieuChi.`;
    
    if (totalErrors > 0) {
      message += ` ❌ Có ${totalErrors} lỗi.`;
      if (errors.length > 0) {
        message += ` Chi tiết: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`;
      }
    }
    
    console.log('🎉 Hoàn thành cập nhật DiemChon');
    console.log(`📊 Tóm tắt: ${processedKhois} xử lý, ${skippedKhois} bỏ qua, ${totalUpdated} cập nhật, ${totalErrors} lỗi`);
    
    return res.render('allforms', { 
      message, 
      activeTab: 'importData' 
    });
    
  } catch (err) {
    console.error('❌ Lỗi tổng thể khi cập nhật DiemChon:', err);
    
    return res.render('allforms', {
      message: `❌ Lỗi khi cập nhật DiemChon: ${err.message}`,
      activeTab: 'importData'
    });
  }
};

// Function để kiểm tra dữ liệu chi tiết
exports.checkDiemChonData = async (req, res) => {
  try {
    console.log('🔍 Kiểm tra dữ liệu DiemChon chi tiết...');
    
    // Kiểm tra ChuongTrinh
    const allChuongTrinh = await ChuongTrinh.find({}).lean();
    console.log(`📊 Tổng số ChuongTrinh: ${allChuongTrinh.length}`);
    
    let validCount = 0;
    let nullCount = 0;
    let invalidCount = 0;
    
    allChuongTrinh.forEach(ct => {
      if (ct.DiemChon === null || ct.DiemChon === undefined || ct.DiemChon === 'null') {
        nullCount++;
      } else if (typeof ct.DiemChon === 'number' && !isNaN(ct.DiemChon)) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`❌ Invalid DiemChon: MaKhoi="${ct.MaKhoi}", DiemChon="${ct.DiemChon}" (type: ${typeof ct.DiemChon})`);
      }
    });
    
    console.log(`📊 ChuongTrinh: ${validCount} hợp lệ, ${nullCount} null, ${invalidCount} không hợp lệ`);
    
    // Lấy một vài mẫu hợp lệ
    const validSamples = allChuongTrinh
      .filter(ct => ct.DiemChon !== null && ct.DiemChon !== undefined && typeof ct.DiemChon === 'number')
      .slice(0, 3);
    
    console.log('📄 Mẫu chương trình hợp lệ:');
    validSamples.forEach(sample => {
      console.log(`  - MaKhoi: "${sample.MaKhoi}", DiemChon: ${sample.DiemChon}`);
    });
    
    // Kiểm tra mapping giữa ChuongTrinh và TieuChiDauRa
    console.log('\n🔗 Kiểm tra mapping ChuongTrinh -> TieuChiDauRa:');
    
    for (const sample of validSamples) {
      const tieuChiCount = await TieuChiDauRa.countDocuments({ MaKhoi: sample.MaKhoi });
      console.log(`  - MaKhoi "${sample.MaKhoi}": ${tieuChiCount} tiêu chí`);
      
      if (tieuChiCount > 0) {
        const tieuChiSamples = await TieuChiDauRa.find({ MaKhoi: sample.MaKhoi }).limit(2).lean();
        tieuChiSamples.forEach(tc => {
          console.log(`    * MaTieuChi: "${tc.MaTieuChi}"`);
        });
      }
    }
    
    // Kiểm tra mapping TieuChiDauRa -> MonHocTieuChi
    console.log('\n🔗 Kiểm tra mapping TieuChiDauRa -> MonHocTieuChi:');
    
    const sampleTieuChi = await TieuChiDauRa.findOne({}).lean();
    if (sampleTieuChi) {
      const monHocCount = await MonHocTieuChi.countDocuments({ MaTieuChi: sampleTieuChi.MaTieuChi });
      console.log(`  - MaTieuChi "${sampleTieuChi.MaTieuChi}": ${monHocCount} bản ghi MonHocTieuChi`);
      
      if (monHocCount > 0) {
        const monHocSample = await MonHocTieuChi.findOne({ MaTieuChi: sampleTieuChi.MaTieuChi }).lean();
        console.log(`    * Sample: MaMH="${monHocSample.MaMH}", DiemChon=${monHocSample.DiemChon}`);
      }
    }
    
    return res.render('allforms', {
      message: `📊 Kiểm tra hoàn tất: ${validCount} chương trình có DiemChon hợp lệ, ${nullCount} null, ${invalidCount} không hợp lệ. Xem console để biết chi tiết mapping.`,
      activeTab: 'importData'
    });
    
  } catch (err) {
    console.error('❌ Lỗi kiểm tra dữ liệu:', err);
    return res.render('allforms', {
      message: `❌ Lỗi kiểm tra dữ liệu: ${err.message}`,
      activeTab: 'importData'
    });
  }
};

// controllers/updateDiemChonController.js
exports.debugDataFlow = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Kiểm tra hướng đi dữ liệu...\n');
    
    // Bước 1: Lấy 1 chương trình có DiemChon
    const sampleChuongTrinh = await ChuongTrinh.findOne({
      DiemChon: { $ne: null, $exists: true }
    }).lean();
    
    if (!sampleChuongTrinh) {
      return res.render('allforms', {
        message: '❌ Không tìm thấy chương trình nào có DiemChon.',
        activeTab: 'importData'
      });
    }
    
    console.log('📝 BƯỚC 1 - ChuongTrinh:');
    console.log(`   MaKhoi: "${sampleChuongTrinh.MaKhoi}"`);
    console.log(`   DiemChon: ${sampleChuongTrinh.DiemChon}`);
    console.log(`   Type: ${typeof sampleChuongTrinh.DiemChon}\n`);
    
    // Bước 2: Tìm TieuChiDauRa theo MaKhoi
    const tieuChiList = await TieuChiDauRa.find({
      MaKhoi: sampleChuongTrinh.MaKhoi
    }).lean();
    
    console.log('📝 BƯỚC 2 - TieuChiDauRa:');
    console.log(`   Tìm thấy: ${tieuChiList.length} tiêu chí`);
    if (tieuChiList.length > 0) {
      console.log('   Danh sách MaTieuChi:');
      tieuChiList.slice(0, 3).forEach((tc, index) => {
        console.log(`   ${index + 1}. "${tc.MaTieuChi}"`);
      });
      if (tieuChiList.length > 3) {
        console.log(`   ... và ${tieuChiList.length - 3} tiêu chí khác`);
      }
    }
    console.log('');
    
    // Bước 3: Kiểm tra MonHocTieuChi cho từng MaTieuChi
    console.log('📝 BƯỚC 3 - MonHocTieuChi:');
    let totalFound = 0;
    let totalWithDiemChon = 0;
    
    for (let i = 0; i < Math.min(3, tieuChiList.length); i++) {
      const maTieuChi = tieuChiList[i].MaTieuChi;
      
      const monHocRecords = await MonHocTieuChi.find({
        MaTieuChi: maTieuChi
      }).lean();
      
      const withDiemChon = monHocRecords.filter(mh => mh.DiemChon !== null && mh.DiemChon !== undefined).length;
      
      console.log(`   MaTieuChi "${maTieuChi}": ${monHocRecords.length} bản ghi, ${withDiemChon} có DiemChon`);
      
      if (monHocRecords.length > 0) {
        const sample = monHocRecords[0];
        console.log(`      Sample: MaMH="${sample.MaMH}", DiemChon=${sample.DiemChon}`);
      }
      
      totalFound += monHocRecords.length;
      totalWithDiemChon += withDiemChon;
    }
    
    console.log(`\n📊 TỔNG KẾT cho MaKhoi "${sampleChuongTrinh.MaKhoi}":`);
    console.log(`   - ${tieuChiList.length} tiêu chí`);
    console.log(`   - ${totalFound} bản ghi MonHocTieuChi (sample 3 tiêu chí đầu)`);
    console.log(`   - ${totalWithDiemChon} bản ghi đã có DiemChon`);
    
    // Test update 1 bản ghi để xem có hoạt động không
    if (tieuChiList.length > 0) {
      const testMaTieuChi = tieuChiList[0].MaTieuChi;
      
      console.log(`\n🧪 TEST UPDATE cho MaTieuChi "${testMaTieuChi}":`);
      
      const updateResult = await MonHocTieuChi.updateMany(
        { MaTieuChi: testMaTieuChi },
        { $set: { DiemChon: sampleChuongTrinh.DiemChon } }
      );
      
      console.log(`   Kết quả: matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);
    }
    
    return res.render('allforms', {
      message: `🔍 Debug hoàn tất cho MaKhoi "${sampleChuongTrinh.MaKhoi}". Tìm thấy ${tieuChiList.length} tiêu chí và ${totalFound} bản ghi MonHocTieuChi. Xem console để biết chi tiết.`,
      activeTab: 'importData'
    });
    
  } catch (err) {
    console.error('❌ Lỗi debug:', err);
    return res.render('allforms', {
      message: `❌ Lỗi debug: ${err.message}`,
      activeTab: 'importData'
    });
  }
};