const mongoose = require('mongoose');
const { MONGO_URI } = require('./backend/config/db.config');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('已连接到 MongoDB');
    
    // 检查总数据量
    const totalCount = await mongoose.connection.db.collection('dailyreports').countDocuments();
    console.log('总数据量:', totalCount);
    
    // 检查2026年1月数据
    const count2026 = await mongoose.connection.db.collection('dailyreports').countDocuments({ 
      date: { $regex: '^2026-01' } 
    });
    console.log('2026年1月数据量:', count2026);
    
    // 检查最新数据
    const latest = await mongoose.connection.db.collection('dailyreports')
      .find({})
      .sort({ date: -1 })
      .limit(5)
      .toArray();
    
    console.log('最新5条数据:');
    latest.forEach(doc => {
      console.log(`- ${doc.hotel_name} ${doc.date}: 销售额¥${doc.projected_revenue?.toLocaleString() || 0}`);
    });
    
    await mongoose.connection.close();
  })
  .catch(console.error);
