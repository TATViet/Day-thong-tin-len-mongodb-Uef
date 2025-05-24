exports.save = async (req, res) => {
    try {
        const { HienDienSV, MaSV, MaKhoa, MaNgChng, MaKhoi, NamHocKy } = req.body;
        // Kiểm tra nếu record đã tồn tại
        const existing = await HienDienSV.findOne({ 
            MaSV, 
            NamHocKy: Number(NamHocKy)
        });
        
        if (existing) {
            return res.render('allforms', { message: '❗ Dữ liệu hiện diện sinh viên đã tồn tại!', activeTab: 'hienDienSV' });
        }
        // Convert the input to a Boolean value
        // Form checkboxes will be 'on' or undefined if not checked
        const isPresent = HienDienSV === 'on' || HienDienSV === true || HienDienSV === '1' || HienDienSV === 1;
        const newHienDien = new HienDienSV({
            HienDienSV: isPresent,  // Store as Boolean
            MaSV, 
            MaKhoa, 
            MaNgChng, 
            MaKhoi, 
            NamHocKy: Number(NamHocKy)
        });
        await newHienDien.save();
        res.render('allforms', { message: '✅ Đã lưu hiện diện sinh viên mới!', activeTab: 'hienDienSV' });
    } catch (err) {
        console.error(err);
        res.render('allforms', { message: '❌ Lỗi khi lưu hiện diện sinh viên.', activeTab: 'hienDienSV' });
    }
};