const { Patient } = require('./models');
const { connectDB } = require('./config/database');

const deleteTestPatients = async () => {
  try {
    await connectDB();
    console.log('Database connected');
    
    // Delete test patients by email pattern
    const deleted = await Patient.destroy({
      where: {
        email: {
          [require('sequelize').Op.or]: [
            { [require('sequelize').Op.like]: '%testpatient%@test.com' },
            { [require('sequelize').Op.like]: '%apitestpatient%@test.com' }
          ]
        }
      }
    });
    
    console.log(`✅ Deleted ${deleted} test patients`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteTestPatients();
