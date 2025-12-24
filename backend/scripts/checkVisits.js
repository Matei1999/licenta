const { connectDB } = require('../config/database');
const { Visit } = require('../models');

(async () => {
  try {
    await connectDB();
    const count = await Visit.count();
    const sample = await Visit.findAll({ attributes: ['id','patientId','ahi','visitDate'], order:[['visitDate','DESC']], limit: 5 });
    console.log('Visit count:', count);
    console.log('Sample:', sample.map(v => ({ id: v.id, patientId: v.patientId, ahi: v.ahi, visitDate: v.visitDate })));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();