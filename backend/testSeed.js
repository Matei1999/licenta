const { sequelize, Patient, Visit, User } = require('./models');
const bcrypt = require('bcryptjs');

const testSeed = async () => {
  try {
    console.log('Test seed starting...');
    
    // Clear existing data
    await Visit.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    console.log('✅ Cleared existing data');
    
    // Create ONE patient
    const patient = await Patient.create({
      firstName: 'Test',
      lastName: 'Patient',
      cnp: '1234567890123',
      dateOfBirth: '1980-01-01',
      gender: 'Male',
      email: 'test@test.com',
      phone: '+40712345678',
      heightCm: 175,
      weightKg: 80,
      neckCircumferenceCm: 40,
      county: 'București',
      locality: 'Sector 1',
      maritalStatus: 'Căsătorit',
      occupation: 'Test',
      educationLevel: 'Universitar',
      environmentType: 'Urban',
      householdSize: 2,
      childrenCount: 0,
      stopBangScore: 5,
      epworthScore: 10,
      sleepPosition: 'Lateral'
    });
    
    console.log('✅ Created patient:', patient.firstName);
    
    // Create ONE visit
    const visit = await Visit.create({
      patientId: patient.id,
      visitDate: '2024-12-01',
      clinician: 'Dr. Test',
      ahi: 15,
      cpapCompliancePct: 85,
      cpapUsageMin: 420,
      maskType: 'Nazală'
    });
    
    console.log('✅ Created visit');
    console.log('✅ Test seed completed!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
};

testSeed();
