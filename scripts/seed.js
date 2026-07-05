// Seed script - Run: node scripts/seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spa-booking';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // Clear existing data
  await db.collection('users').deleteMany({});
  await db.collection('services').deleteMany({});
  await db.collection('banners').deleteMany({});
  console.log('Cleared existing data');

  // Create admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await db.collection('users').insertOne({
    fullName: 'Admin Spa',
    email: 'admin@spa.com',
    password: adminPassword,
    phone: '0901234567',
    role: 'admin',
    memberType: 'normal',
    totalBookings: 0,
    totalEstimatedAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created admin: admin@spa.com / admin123');

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 10);
  await db.collection('users').insertOne({
    fullName: 'Nguyễn Văn A',
    email: 'user@spa.com',
    password: userPassword,
    phone: '0987654321',
    role: 'user',
    memberType: 'normal',
    totalBookings: 0,
    totalEstimatedAmount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Created user: user@spa.com / user123');

  // Create staff members
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffData = [
    { fullName: 'NV1 - Nguyễn Hương Spa', email: 'nv1@spa.com', password: staffPassword, phone: '0900000001', role: 'staff', memberType: 'normal', totalBookings: 0, totalEstimatedAmount: 0, createdAt: new Date(), updatedAt: new Date() },
    { fullName: 'NV2 - Trần Hằng Nail', email: 'nv2@spa.com', password: staffPassword, phone: '0900000002', role: 'staff', memberType: 'normal', totalBookings: 0, totalEstimatedAmount: 0, createdAt: new Date(), updatedAt: new Date() },
    { fullName: 'NV3 - Lê Vy Makeup', email: 'nv3@spa.com', password: staffPassword, phone: '0900000003', role: 'staff', memberType: 'normal', totalBookings: 0, totalEstimatedAmount: 0, createdAt: new Date(), updatedAt: new Date() },
  ];
  const staffResults = await db.collection('users').insertMany(staffData);
  const staffIds = Object.values(staffResults.insertedIds);
  console.log('Created 3 staff members: nv1@spa.com, nv2@spa.com, nv3@spa.com / staff123');

  // Create services - using Pexels direct CDN URLs (always working)
  const services = [
    // SPA - NV1 and NV3
    { serviceName: 'Massage Thư Giãn Toàn Thân', serviceType: 'spa', description: 'Massage toàn thân giúp thư giãn, giảm stress với tinh dầu thiên nhiên cao cấp.', duration: 90, price: 500000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Chăm Sóc Da Mặt Premium', serviceType: 'spa', description: 'Liệu trình chăm sóc da mặt chuyên sâu với các sản phẩm cao cấp từ Hàn Quốc.', duration: 60, price: 350000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Xông Hơi Thảo Dược', serviceType: 'spa', description: 'Xông hơi với thảo dược tự nhiên giúp thanh lọc cơ thể, đẹp da.', duration: 45, price: 200000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Tẩy Tế Bào Chết Body', serviceType: 'spa', description: 'Tẩy tế bào chết toàn thân giúp da mịn màng, trắng sáng tự nhiên.', duration: 60, price: 300000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=800' },

    // NAIL - NV2 and NV3
    { serviceName: 'Sơn Gel Cao Cấp', serviceType: 'nail', description: 'Sơn gel với hàng trăm màu sắc thời trang, bền đẹp 2-3 tuần.', duration: 45, price: 150000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/939835/pexels-photo-939835.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Nail Art Design', serviceType: 'nail', description: 'Vẽ nail nghệ thuật theo yêu cầu với đá, charm, lụa cao cấp.', duration: 90, price: 350000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/704815/pexels-photo-704815.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Chăm Sóc Móng Tay', serviceType: 'nail', description: 'Cắt, dũa, đánh bóng và dưỡng móng chuyên nghiệp.', duration: 30, price: 100000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Phủ Bột Acrylic', serviceType: 'nail', description: 'Đắp bột acrylic tạo hình móng theo xu hướng, bền đẹp lâu dài.', duration: 120, price: 400000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3997383/pexels-photo-3997383.jpeg?auto=compress&cs=tinysrgb&w=800' },

    // MAKEUP - All staff (NV1, NV2, NV3)
    { serviceName: 'Trang Điểm Dự Tiệc', serviceType: 'makeup', description: 'Trang điểm chuyên nghiệp cho tiệc, sự kiện với phong cách sang trọng.', duration: 60, price: 400000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Trang Điểm Cô Dâu', serviceType: 'makeup', description: 'Makeup cô dâu đẹp rạng ngời trong ngày trọng đại.', duration: 120, price: 1500000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/1377034/pexels-photo-1377034.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Trang Điểm Tự Nhiên', serviceType: 'makeup', description: 'Makeup nhẹ nhàng, tự nhiên cho đi làm, đi học hàng ngày.', duration: 30, price: 200000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/2661256/pexels-photo-2661256.jpeg?auto=compress&cs=tinysrgb&w=800' },
    { serviceName: 'Nối Mi Classic', serviceType: 'makeup', description: 'Nối mi sợi tơ 1:1 tự nhiên, nhẹ nhàng, không gây hại mắt.', duration: 90, price: 300000, isCombo: false, comboServices: [], isActive: true, allowedStaff: [], imagePath: '', imageUrl: 'https://images.pexels.com/photos/3373716/pexels-photo-3373716.jpeg?auto=compress&cs=tinysrgb&w=800' },
  ];

  const serviceResults = await db.collection('services').insertMany(
    services.map((s) => ({ ...s, createdAt: new Date(), updatedAt: new Date() }))
  );
  console.log(`Created ${services.length} services`);

  // Create banners - using Pexels direct CDN URLs
  const banners = [
    { title: 'Luxe Beauty Spa', subtitle: 'Nơi vẻ đẹp toả sáng', position: 'HOME_HERO', targetServiceType: 'all', link: '/services', sortOrder: 1, isActive: true, imagePath: '', imageUrl: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1200' },
    { title: 'Khuyến Mãi Nail Art', subtitle: 'Giảm 20% trong tháng này', position: 'HOME_HERO', targetServiceType: 'nail', link: '/services?type=nail', sortOrder: 2, isActive: true, imagePath: '', imageUrl: 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&w=1200' },
    { title: 'Trải Nghiệm Spa Thượng Hạng', subtitle: 'Thư giãn và tái tạo năng lượng', position: 'HOME_HERO', targetServiceType: 'spa', link: '/services?type=spa', sortOrder: 3, isActive: true, imagePath: '', imageUrl: 'https://images.pexels.com/photos/3188/love-romantic-bath-candlelight.jpg?auto=compress&cs=tinysrgb&w=1200' },
  ];

  await db.collection('banners').insertMany(
    banners.map((b) => ({ ...b, createdAt: new Date(), updatedAt: new Date() }))
  );
  console.log(`Created ${banners.length} banners`);

  console.log('\nSeed completed!');
  console.log('Admin: admin@spa.com / admin123');
  console.log('User: user@spa.com / user123');
  console.log('Staff 1: nv1@spa.com / staff123');
  console.log('Staff 2: nv2@spa.com / staff123');
  console.log('Staff 3: nv3@spa.com / staff123');

  await mongoose.disconnect();
}

seed().catch(console.error);

