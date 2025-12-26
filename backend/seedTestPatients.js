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
      },
      {
        firstName: 'Cristian',
        lastName: 'Dumitrescu',
        cnp: '1750318567890',
        dateOfBirth: '1975-03-18',
        gender: 'Male',
        email: 'cristian.dumitru@test.ro',
        phone: '+40745654321',
        heightCm: 180,
        weightKg: 110,
        neckCircumferenceCm: 45,
        county: 'Constanța',
        locality: 'Constanța',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Șofer TIR',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 8,
        epworthScore: 18,
        status: 'Active',
        visit: {
          ahi: 42.3,
          cpapUsageHours: 4.8,
          visitDate: '2024-12-20'
        }
      },
      {
        firstName: 'Roxana',
        lastName: 'Georgescu',
        cnp: '2880725456789',
        dateOfBirth: '1988-07-25',
        gender: 'Female',
        email: 'roxana.geo@test.ro',
        phone: '+40756789123',
        heightCm: 162,
        weightKg: 75,
        neckCircumferenceCm: 34,
        county: 'București',
        locality: 'Sector 1',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Asistent medical',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 5,
        epworthScore: 12,
        status: 'Active',
        visit: {
          ahi: 19.7,
          cpapUsageHours: 6.8,
          visitDate: '2024-12-19'
        }
      },
      {
        firstName: 'Vlad',
        lastName: 'Stoian',
        cnp: '1870504123456',
        dateOfBirth: '1987-05-04',
        gender: 'Male',
        email: 'vlad.stoian@test.ro',
        phone: '+40767890123',
        heightCm: 178,
        weightKg: 95,
        neckCircumferenceCm: 42,
        county: 'Galați',
        locality: 'Galați',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Programator',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 6,
        epworthScore: 14,
        status: 'Active',
        visit: {
          ahi: 26.1,
          cpapUsageHours: 5.9,
          visitDate: '2024-12-17'
        }
      },
      {
        firstName: 'Lidia',
        lastName: 'Nedelcu',
        cnp: '2920110789012',
        dateOfBirth: '1992-01-10',
        gender: 'Female',
        email: 'lidia.nedelcu@test.ro',
        phone: '+40789012345',
        heightCm: 167,
        weightKg: 82,
        neckCircumferenceCm: 36,
        county: 'Prahova',
        locality: 'Ploiești',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Profesor',
        educationLevel: 'Postuniversitar',
        environmentType: 'Urban',
        stopBangScore: 5,
        epworthScore: 10,
        status: 'Active',
        visit: {
          ahi: 17.4,
          cpapUsageHours: 7.2,
          visitDate: '2024-12-21'
        }
      },
      {
        firstName: 'Bogdan',
        lastName: 'Radu',
        cnp: '1930625234567',
        dateOfBirth: '1993-06-25',
        gender: 'Male',
        email: 'bogdan.radu@test.ro',
        phone: '+40745789012',
        heightCm: 176,
        weightKg: 92,
        neckCircumferenceCm: 40,
        county: 'Sibiu',
        locality: 'Sibiu',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Constructor',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 7,
        epworthScore: 15,
        status: 'Active',
        visit: {
          ahi: 31.5,
          cpapUsageHours: 5.5,
          visitDate: '2024-12-16'
        }
      },
      {
        firstName: 'Simona',
        lastName: 'Ciocan',
        cnp: '2870408345678',
        dateOfBirth: '1987-04-08',
        gender: 'Female',
        email: 'simona.ciocan@test.ro',
        phone: '+40756901234',
        heightCm: 164,
        weightKg: 88,
        neckCircumferenceCm: 37,
        county: 'Arad',
        locality: 'Arad',
        maritalStatus: 'Divorțat/ă',
        occupation: 'Avocată',
        educationLevel: 'Postuniversitar',
        environmentType: 'Urban',
        stopBangScore: 6,
        epworthScore: 13,
        status: 'Active',
        visit: {
          ahi: 24.6,
          cpapUsageHours: 6.3,
          visitDate: '2024-12-18'
        }
      },
      {
        firstName: 'Gheorghe',
        lastName: 'Popov',
        cnp: '1940820567890',
        dateOfBirth: '1994-08-20',
        gender: 'Male',
        email: 'gheorghe.popov@test.ro',
        phone: '+40767012345',
        heightCm: 183,
        weightKg: 108,
        neckCircumferenceCm: 44,
        county: 'Dolj',
        locality: 'Craiova',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Taximetrist',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 8,
        epworthScore: 17,
        status: 'Active',
        visit: {
          ahi: 38.7,
          cpapUsageHours: 4.2,
          visitDate: '2024-12-19'
        }
      },
      {
        firstName: 'Ioana',
        lastName: 'Moldovan',
        cnp: '2960212789012',
        dateOfBirth: '1996-02-12',
        gender: 'Female',
        email: 'ioana.moldovan@test.ro',
        phone: '+40789234567',
        heightCm: 169,
        weightKg: 79,
        neckCircumferenceCm: 35,
        county: 'Bihor',
        locality: 'Oradea',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Arhitect',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 4,
        epworthScore: 8,
        status: 'Active',
        visit: {
          ahi: 13.2,
          cpapUsageHours: 8.1,
          visitDate: '2024-12-22'
        }
      },
      {
        firstName: 'Ionuț',
        lastName: 'Petrescu',
        cnp: '1950715234567',
        dateOfBirth: '1995-07-15',
        gender: 'Male',
        email: 'ionut.petrescu@test.ro',
        phone: '+40745012345',
        heightCm: 172,
        weightKg: 86,
        neckCircumferenceCm: 39,
        county: 'Buzău',
        locality: 'Buzău',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Electrician',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 6,
        epworthScore: 12,
        status: 'Active',
        visit: {
          ahi: 20.3,
          cpapUsageHours: 6.7,
          visitDate: '2024-12-17'
        }
      },
      {
        firstName: 'Daniela',
        lastName: 'Popa',
        cnp: '2930511456789',
        dateOfBirth: '1993-05-11',
        gender: 'Female',
        email: 'daniela.popa@test.ro',
        phone: '+40756234567',
        heightCm: 166,
        weightKg: 81,
        neckCircumferenceCm: 36,
        county: 'Satu Mare',
        locality: 'Satu Mare',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Farmacistă',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 5,
        epworthScore: 11,
        status: 'Active',
        visit: {
          ahi: 16.8,
          cpapUsageHours: 7.6,
          visitDate: '2024-12-20'
        }
      },
      {
        firstName: 'Pavel',
        lastName: 'Antonescu',
        cnp: '1880103567890',
        dateOfBirth: '1988-01-03',
        gender: 'Male',
        email: 'pavel.anton@test.ro',
        phone: '+40767345678',
        heightCm: 179,
        weightKg: 101,
        neckCircumferenceCm: 43,
        county: 'Vâlcea',
        locality: 'Râmnicu Vâlcea',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Șofer profesionist',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 7,
        epworthScore: 16,
        status: 'Active',
        visit: {
          ahi: 33.9,
          cpapUsageHours: 5.1,
          visitDate: '2024-12-18'
        }
      },
      {
        firstName: 'Camelia',
        lastName: 'Enescu',
        cnp: '2920820234567',
        dateOfBirth: '1992-08-20',
        gender: 'Female',
        email: 'camelia.enescu@test.ro',
        phone: '+40789456789',
        heightCm: 171,
        weightKg: 87,
        neckCircumferenceCm: 37,
        county: 'Olt',
        locality: 'Slatina',
        maritalStatus: 'Căsătorit/ă',
        occupation: 'Economist',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        stopBangScore: 5,
        epworthScore: 10,
        status: 'Active',
        visit: {
          ahi: 18.9,
          cpapUsageHours: 7.4,
          visitDate: '2024-12-21'
        }
      },
      {
        firstName: 'Radu',
        lastName: 'Drăgan',
        cnp: '1920614345678',
        dateOfBirth: '1992-06-14',
        gender: 'Male',
        email: 'radu.dragan@test.ro',
        phone: '+40745567890',
        heightCm: 181,
        weightKg: 103,
        neckCircumferenceCm: 44,
        county: 'Mehedinți',
        locality: 'Drobeta-Turnu Severin',
        maritalStatus: 'Necăsătorit/ă',
        occupation: 'Șofer TIR internațional',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        stopBangScore: 8,
        epworthScore: 19,
        status: 'Active',
        visit: {
          ahi: 45.1,
          cpapUsageHours: 3.9,
          visitDate: '2024-12-16'
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
      const cpapUsageMinutes = Math.round((visitData.cpapUsageHours / 24) * 60 * 60); // Convert hours to minutes
      const compliancePercent = Math.round((visitData.cpapUsageHours / 24) * 100);
      await Visit.create({
        patientId: patient.id,
        visitDate: visitData.visitDate,
        clinician: doctor.name,
        recordedById: doctor.id,
        ahi: visitData.ahi,
        cpapUsageMin: cpapUsageMinutes,
        cpapCompliancePct: compliancePercent,
        spo2Min: 85 + Math.floor(Math.random() * 5),
        spo2Max: 96 + Math.floor(Math.random() * 3),
        spo2Mean: (91 + Math.random() * 4).toFixed(2),
        desatIndex: (visitData.ahi * (0.7 + Math.random() * 0.4)).toFixed(2),
        t90: (Math.random() * 15 + 2).toFixed(2),
        ahiResidual: (visitData.ahi * 0.2).toFixed(1),
        compliance: compliancePercent,
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
