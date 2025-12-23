const { Patient, User } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const testCreatePatient = async () => {
  try {
    console.log('Starting test...');
    
    // Create or find a test user
    let user = await User.findOne({ where: { email: 'test@test.com' } });
    if (!user) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await User.create({
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'doctor'
      });
      console.log('Created test user');
    }

    // Try to create a patient with minimal fields
    const testPatientData = {
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'Male',
      email: 'testpatient' + Date.now() + '@test.com',
      phone: '0123456789'
    };

    console.log('Attempting to create patient with data:', testPatientData);
    
    const patient = await Patient.create(testPatientData);
    
    console.log('✅ Patient created successfully:', patient.id);
    console.log('Patient data:', {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      cnp: patient.cnp,
      cnp_hash: patient.cnp_hash
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating patient:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors.map(e => ({ 
        field: e.path, 
        message: e.message, 
        type: e.type 
      })));
    }
    process.exit(1);
  }
};

testCreatePatient();
