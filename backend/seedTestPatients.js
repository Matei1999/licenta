const { Patient, Visit, User } = require('./models');
const { connectDB } = require('./config/database');

const seedTestPatients = async () => {
  try {
    await connectDB();
    console.log('Database connected');

    // Find a doctor user
    let doctor = await User.findOne({ where: { role: 'doctor' } });
    if (!doctor) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      doctor = await User.create({
        name: 'Dr. Test',
        email: 'doctor@test.com',
        password: hashedPassword,
        role: 'doctor'
      });
    }

    const testPatients = [
      {
        firstName: 'Ana',
        lastName: 'Popescu',
        cnp: '2850415234567',
        dateOfBirth: '1985-04-15',
        gender: 'Female',
        email: 'ana.popescu@test.ro',
        phone: '+40745123456',
        heightCm: 165,
        weightKg: 78,
        neckCircumferenceCm: 36,
        county: 'București',
        locality: 'Sector 3',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Contabil',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 6,
        epworthScore: 14,
        status: 'Active',
        visit: {
          ahi: 28.5,
          cpapUsageHours: 6.5,
          visitDate: '2024-12-15'
        }
      },
      {
        firstName: 'Mihai',
        lastName: 'Ionescu',
        cnp: '1920820345678',
        dateOfBirth: '1992-08-20',
        gender: 'Male',
        email: 'mihai.ionescu@test.ro',
        phone: '+40756234567',
        heightCm: 182,
        weightKg: 105,
        neckCircumferenceCm: 44,
        county: 'Cluj',
        locality: 'Cluj-Napoca',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Inginer IT',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 7,
        epworthScore: 16,
        status: 'Active',
        visit: {
          ahi: 35.2,
          cpapUsageHours: 5.2,
          visitDate: '2024-12-10'
        }
      },
      {
        firstName: 'Elena',
        lastName: 'Constantinescu',
        cnp: '2790305456789',
        dateOfBirth: '1979-03-05',
        gender: 'Female',
        email: 'elena.const@test.ro',
        phone: '+40767345678',
        heightCm: 170,
        weightKg: 92,
        neckCircumferenceCm: 38,
        county: 'Timiș',
        locality: 'Timișoara',
        maritalStatus: 'Divorțat/ă',
        occupation: 'Profesoară',
        educationLevel: 'Postuniversitar',
        environmentType: 'Urban',
        stopBangScore: 5,
        epworthScore: 11,
        status: 'Active',
        visit: {
          ahi: 22.8,
          cpapUsageHours: 7.8,
          visitDate: '2024-12-18'
        }
      },
      {
        firstName: 'Andrei',
        lastName: 'Marinescu',
        cnp: '1880612567890',
        dateOfBirth: '1988-06-12',
        gender: 'Male',
        email: 'andrei.marin@test.ro',
        phone: '+40778456789',
        heightCm: 175,
        weightKg: 88,
        neckCircumferenceCm: 41,
        county: 'Brașov',
        locality: 'Brașov',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Manager',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 6,
        epworthScore: 13,
        status: 'Active',
        visit: {
          ahi: 18.5,
          cpapUsageHours: 8.2,
          visitDate: '2024-12-20'
        }
      },
      {
        firstName: 'Maria',
        lastName: 'Vasilescu',
        cnp: '2950925678901',
        dateOfBirth: '1995-09-25',
        gender: 'Female',
        email: 'maria.vasilescu@test.ro',
        phone: '+40789567890',
        heightCm: 168,
        weightKg: 85,
        neckCircumferenceCm: 37,
        county: 'Iași',
        locality: 'Iași',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Medic',
        educationLevel: 'Postuniversitar',
        environmentType: 'Urban',
        stopBangScore: 4,
        epworthScore: 9,
        status: 'Active',
        visit: {
          ahi: 15.2,
          cpapUsageHours: 7.5,
          visitDate: '2024-12-22'
        }
      }
    ];

    for (const patientData of testPatients) {
      // Check if patient already exists
      const existing = await Patient.findOne({ where: { email: patientData.email } });
      if (existing) {
        console.log(`⏭️  Patient ${patientData.firstName} ${patientData.lastName} already exists`);
        continue;
      }

      // Extract visit data
      const visitData = patientData.visit;
      delete patientData.visit;

      // Create patient
      const patient = await Patient.create(patientData);
      console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);

      // Create visit
      await Visit.create({
        patientId: patient.id,
        visitDate: visitData.visitDate,
        clinician: doctor.name,
        recordedBy: doctor.id,
        ahi: visitData.ahi,
        cpapUsageHours: visitData.cpapUsageHours,
        spo2Min: 88 + Math.floor(Math.random() * 5),
        ahiResidual: (visitData.ahi * 0.2).toFixed(1),
        compliance: ((visitData.cpapUsageHours / 24) * 100).toFixed(1),
        notes: 'Vizită de control'
      });
      console.log(`  ✅ Created visit for ${patient.firstName}`);
    }

    console.log('\n🎉 Test patients seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedTestPatients();
