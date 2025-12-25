const { Patient, Visit } = require('./models');
const { connectDB } = require('./config/database');

const cleanup = async () => {
  try {
    await connectDB();
    console.log('Database connected');

    // Delete all visits first
    const deleteVisits = await Visit.destroy({ where: {} });
    console.log(`✅ Deleted ${deleteVisits} visits`);

    // Delete all patients
    const deletePatients = await Patient.destroy({ where: {} });
    console.log(`✅ Deleted ${deletePatients} patients`);

    console.log('\n🎉 Database cleaned successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
};

cleanup();
