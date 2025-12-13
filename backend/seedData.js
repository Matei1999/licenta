const { sequelize, Patient, Visit, User } = require('./models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...');
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      console.error('❌ Seed timeout after 30s');
      process.exit(1);
    }, 30000);

    // Create demo user if not exists
    let demoUser = await User.findOne({ where: { email: 'demo@osa.ro' } });
    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      demoUser = await User.create({
        name: 'Dr. Demo OSA',
        email: 'demo@osa.ro',
        password: hashedPassword,
        role: 'doctor'
      });
      console.log('✅ Demo user created');
    }

    // Demo patients data
    const demoPatients = [
      {
        firstName: 'Ion',
        lastName: 'Popescu',
        cnp: '1780512345678',
        dateOfBirth: '1978-05-12',
        gender: 'Male',
        email: 'ion.popescu@email.ro',
        phone: '+40712345678',
        heightCm: 178,
        weightKg: 98,
        neckCircumferenceCm: 43,
        county: 'București',
        locality: 'Sector 1',
        maritalStatus: 'Căsătorit',
        occupation: 'Inginer software',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        householdSize: 4,
        childrenCount: 2,
        stopBangScore: 7,
        epworthScore: 16,
        sleepPosition: 'Spate',
        comorbidities: {
          cardiovascular: ['I10', 'I25.1'],
          metabolic: ['E11.9'],
          respiratory: [],
          neurologic: [],
          other: []
        },
        behavioral: {
          avgSleepDuration: 6,
          sleepRhythm: 'Regulat',
          hasNaps: true,
          smokingStatus: 'Fumător activ (20 ani)',
          alcoholQuantity: '2-3 unități/zi',
          caffeineUnits: 4,
          physicalActivityMin: 60,
          mallampati: 'III',
          septumDeviation: true,
          macroglossia: false,
          tonsillarHypertrophy: false
        },
        psychosocial: {
          phq2Score: 3,
          gad2Score: 4,
          rosenbergScore: 28,
          whoqolPhysical: 62,
          whoqolPsychological: 58,
          whoqolSocial: 65,
          whoqolEnvironment: 70
        },
        biomarkers: {
          crp: 4.2,
          hba1c: 6.8,
          ldl: 145,
          hdl: 38,
          triglycerides: 210,
          tsh: 2.1,
          vitaminD: 18,
          creatinine: 0.9
        },
        cpapData: {
          brand: 'ResMed',
          model: 'AirSense 10 AutoSet',
          therapyType: 'APAP',
          pressureMin: 8,
          pressureMax: 14,
          startDate: '2024-08-02',
          maskType: 'Nazală',
          humidificationEnabled: true,
          humidificationLevel: 4,
          rampEnabled: true,
          rampTime: 20
        },
        notes: 'Pacient compliant, evoluție foarte bună. Simptome diurne îmbunătățite semnificativ.'
      },
      {
        firstName: 'Maria',
        lastName: 'Ionescu',
        cnp: '2850620123456',
        dateOfBirth: '1985-06-20',
        gender: 'Female',
        email: 'maria.ionescu@email.ro',
        phone: '+40723456789',
        heightCm: 165,
        weightKg: 82,
        neckCircumferenceCm: 38,
        county: 'Cluj',
        locality: 'Cluj-Napoca',
        maritalStatus: 'Necăsătorit',
        occupation: 'Profesor',
        educationLevel: 'Postuniversitar',
        environmentType: 'Urban',
        householdSize: 1,
        childrenCount: 0,
        stopBangScore: 5,
        epworthScore: 12,
        sleepPosition: 'Lateral',
        comorbidities: {
          cardiovascular: ['I10'],
          metabolic: ['E66.9'],
          respiratory: ['J30.4'],
          neurologic: ['F41.9'],
          other: ['K21.9']
        },
        behavioral: {
          avgSleepDuration: 7,
          sleepRhythm: 'Regulat',
          hasNaps: false,
          smokingStatus: 'Non-fumător',
          alcoholQuantity: 'Ocazional',
          caffeineUnits: 2,
          physicalActivityMin: 150,
          mallampati: 'II',
          septumDeviation: false,
          macroglossia: false,
          tonsillarHypertrophy: false
        },
        psychosocial: {
          phq2Score: 2,
          gad2Score: 5,
          rosenbergScore: 32,
          whoqolPhysical: 72,
          whoqolPsychological: 68,
          whoqolSocial: 75,
          whoqolEnvironment: 78
        },
        biomarkers: {
          crp: 2.8,
          hba1c: 5.4,
          ldl: 110,
          hdl: 52,
          triglycerides: 130,
          tsh: 1.8,
          vitaminD: 28,
          creatinine: 0.8
        },
        cpapData: {
          brand: 'Philips',
          model: 'DreamStation 2',
          therapyType: 'APAP',
          pressureMin: 6,
          pressureMax: 12,
          startDate: '2024-09-15',
          maskType: 'Pillows (perne nazale)',
          humidificationEnabled: true,
          humidificationLevel: 3,
          rampEnabled: false
        },
        notes: 'Adaptare bună la CPAP. Complianță excelentă.'
      },
      {
        firstName: 'George',
        lastName: 'Marinescu',
        cnp: '1720830456789',
        dateOfBirth: '1972-08-30',
        gender: 'Male',
        email: 'george.marinescu@email.ro',
        phone: '+40734567890',
        heightCm: 182,
        weightKg: 115,
        neckCircumferenceCm: 46,
        county: 'Timiș',
        locality: 'Timișoara',
        maritalStatus: 'Căsătorit',
        occupation: 'Șofer TIR',
        educationLevel: 'Liceal',
        environmentType: 'Urban',
        householdSize: 3,
        childrenCount: 1,
        stopBangScore: 8,
        epworthScore: 21,
        sleepPosition: 'Spate',
        comorbidities: {
          cardiovascular: ['I10', 'I48', 'I50.9'],
          metabolic: ['E11.9', 'E66.9', 'E78.5'],
          respiratory: [],
          neurologic: [],
          other: []
        },
        behavioral: {
          avgSleepDuration: 5,
          sleepRhythm: 'Neregulat',
          hasNaps: true,
          smokingStatus: 'Fumător activ (30 ani)',
          alcoholQuantity: '4-5 unități/zi',
          caffeineUnits: 6,
          physicalActivityMin: 30,
          mallampati: 'IV',
          septumDeviation: true,
          macroglossia: true,
          tonsillarHypertrophy: false
        },
        psychosocial: {
          phq2Score: 5,
          gad2Score: 4,
          rosenbergScore: 22,
          whoqolPhysical: 48,
          whoqolPsychological: 52,
          whoqolSocial: 55,
          whoqolEnvironment: 58
        },
        biomarkers: {
          crp: 8.5,
          hba1c: 7.9,
          ldl: 168,
          hdl: 32,
          triglycerides: 285,
          tsh: 3.2,
          vitaminD: 12,
          creatinine: 1.1
        },
        cpapData: {
          brand: 'ResMed',
          model: 'AirCurve 10 VAuto',
          therapyType: 'BiPAP',
          pressureMin: 10,
          pressureMax: 18,
          startDate: '2024-06-10',
          maskType: 'Facială completă',
          humidificationEnabled: true,
          humidificationLevel: 5,
          rampEnabled: true,
          rampTime: 30,
          technicalProblems: 'Scurgeri frecvente, dificultăți adaptare mască'
        },
        notes: 'Caz sever OSA cu multiple comorbidități. Complianță scăzută - necesită educare intensivă. Risc cardiovascular crescut.'
      },
      {
        firstName: 'Elena',
        lastName: 'Dumitrescu',
        cnp: '2920415234567',
        dateOfBirth: '1992-04-15',
        gender: 'Female',
        email: 'elena.dumitrescu@email.ro',
        phone: '+40745678901',
        heightCm: 158,
        weightKg: 68,
        neckCircumferenceCm: 34,
        county: 'Iași',
        locality: 'Iași',
        maritalStatus: 'Divorțat',
        occupation: 'Asistent medical',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        householdSize: 2,
        childrenCount: 1,
        stopBangScore: 3,
        epworthScore: 8,
        sleepPosition: 'Lateral',
        comorbidities: {
          cardiovascular: [],
          metabolic: [],
          respiratory: ['J45.9'],
          neurologic: ['F32.9'],
          other: []
        },
        behavioral: {
          avgSleepDuration: 6.5,
          sleepRhythm: 'Schimbător (ture)',
          hasNaps: true,
          smokingStatus: 'Non-fumător',
          alcoholQuantity: 'Deloc',
          caffeineUnits: 3,
          physicalActivityMin: 90,
          mallampati: 'II',
          septumDeviation: false,
          macroglossia: false,
          tonsillarHypertrophy: true
        },
        psychosocial: {
          phq2Score: 4,
          gad2Score: 3,
          rosenbergScore: 26,
          whoqolPhysical: 68,
          whoqolPsychological: 62,
          whoqolSocial: 58,
          whoqolEnvironment: 65
        },
        biomarkers: {
          crp: 1.2,
          hba1c: 5.1,
          ldl: 95,
          hdl: 58,
          triglycerides: 88,
          tsh: 1.5,
          vitaminD: 32,
          creatinine: 0.7
        },
        cpapData: {
          brand: 'Philips',
          model: 'DreamStation Auto',
          therapyType: 'APAP',
          pressureMin: 5,
          pressureMax: 10,
          startDate: '2024-10-01',
          maskType: 'Pillows (perne nazale)',
          humidificationEnabled: true,
          humidificationLevel: 2,
          rampEnabled: false
        },
        notes: 'OSA ușor, dar simptome importante din cauza programului în ture. Răspuns bun la tratament.'
      },
      {
        firstName: 'Andrei',
        lastName: 'Constantinescu',
        cnp: '1950205345678',
        dateOfBirth: '1995-02-05',
        gender: 'Male',
        email: 'andrei.const@email.ro',
        phone: '+40756789012',
        heightCm: 175,
        weightKg: 88,
        neckCircumferenceCm: 40,
        county: 'Brașov',
        locality: 'Brașov',
        maritalStatus: 'Necăsătorit',
        occupation: 'Programator',
        educationLevel: 'Universitar',
        environmentType: 'Urban',
        householdSize: 1,
        childrenCount: 0,
        stopBangScore: 4,
        epworthScore: 14,
        sleepPosition: 'Variabil',
        comorbidities: {
          cardiovascular: [],
          metabolic: [],
          respiratory: [],
          neurologic: ['F41.9', 'G43.9'],
          other: []
        },
        behavioral: {
          avgSleepDuration: 5.5,
          sleepRhythm: 'Neregulat',
          hasNaps: false,
          smokingStatus: 'Non-fumător',
          alcoholQuantity: '1-2 unități/săptămână',
          caffeineUnits: 5,
          physicalActivityMin: 45,
          mallampati: 'II',
          septumDeviation: true,
          macroglossia: false,
          tonsillarHypertrophy: false
        },
        psychosocial: {
          phq2Score: 3,
          gad2Score: 5,
          rosenbergScore: 30,
          whoqolPhysical: 70,
          whoqolPsychological: 64,
          whoqolSocial: 62,
          whoqolEnvironment: 72
        },
        biomarkers: {
          crp: 0.8,
          hba1c: 4.9,
          ldl: 102,
          hdl: 48,
          triglycerides: 110,
          tsh: 2.0,
          vitaminD: 22,
          creatinine: 0.85
        },
        cpapData: {
          brand: 'ResMed',
          model: 'AirMini',
          therapyType: 'APAP',
          pressureMin: 6,
          pressureMax: 11,
          startDate: '2024-11-05',
          maskType: 'Nazală',
          humidificationEnabled: false,
          rampEnabled: true,
          rampTime: 15
        },
        notes: 'Pacient tânăr, motivat. Stil de viață sedentar - recomandat scădere în greutate și activitate fizică.'
      }
    ];

    // Create patients with visits
    for (const patientData of demoPatients) {
      // Check if patient already exists
      const existingPatient = await Patient.findOne({ where: { cnp: patientData.cnp } });
      if (existingPatient) {
        console.log(`⏭️  Patient ${patientData.firstName} ${patientData.lastName} already exists`);
        continue;
      }

      // Create patient
      const patient = await Patient.create(patientData);
      console.log(`✅ Created patient: ${patient.firstName} ${patient.lastName}`);

      // Create visits for each patient
      const visitDates = [
        { date: '2024-08-15', months: 4 },
        { date: '2024-10-15', months: 2 },
        { date: '2024-12-05', months: 0 }
      ];

      for (const visitInfo of visitDates) {
        // Generate realistic visit data with improvement over time
        const baseAhi = patient.stopBangScore * 4 + Math.random() * 10;
        const improvement = visitInfo.months * 0.15; // 15% improvement per month
        const ahi = Math.max(2, baseAhi * (1 - improvement));
        
        const baseCompliance = 50 + patient.epworthScore * 2;
        const complianceImprovement = visitInfo.months * 5;
        const compliance = Math.min(98, baseCompliance + complianceImprovement);

        await Visit.create({
          patientId: patient.id,
          visitDate: visitInfo.date,
          clinician: 'Dr. Demo OSA',
          recordedBy: demoUser.id,
          // Sleep metrics
          ahi: parseFloat(ahi.toFixed(1)),
          ahiResidual: parseFloat((ahi * 0.2).toFixed(1)),
          desatIndex: parseFloat((ahi * 0.7).toFixed(1)),
          ahiNrem: parseFloat((ahi * 0.85).toFixed(1)),
          ahiRem: parseFloat((ahi * 1.3).toFixed(1)),
          // Oxygen metrics
          spo2Min: Math.floor(85 + Math.random() * 5),
          spo2Max: 98,
          spo2Mean: parseFloat((93 + Math.random() * 3).toFixed(1)),
          t90: parseFloat((ahi * 0.15).toFixed(1)),
          t45: parseFloat((ahi * 0.02).toFixed(2)),
          povaraHipoxica: parseFloat((ahi * 2.5).toFixed(1)),
          // CPAP metrics
          cpapCompliancePct: Math.floor(compliance),
          cpapCompliance4hPct: Math.floor(compliance * 0.95),
          cpapUsageMin: Math.floor(240 + compliance * 3),
          cpapLeaks95p: parseFloat((15 - improvement * 2).toFixed(1)),
          cpapPressure95p: parseFloat((10 + Math.random() * 3).toFixed(1)),
          // Mask
          maskType: patient.cpapData.maskType,
          maskFitGood: compliance > 70,
          maskChange: visitInfo.months === 2,
          notes: visitInfo.months === 0 
            ? 'Vizită de control recentă. Evoluție în curs.' 
            : `Control după ${visitInfo.months} luni. ${compliance > 70 ? 'Complianță bună.' : 'Necesită îmbunătățire complianță.'}`
        });
      }

      console.log(`✅ Created 3 visits for ${patient.firstName} ${patient.lastName}`);
    }

    clearTimeout(timeoutId);
    console.log('\n🎉 Seed completed successfully!');
    console.log(`📊 Created ${demoPatients.length} patients with 3 visits each`);
    console.log('\n👤 Demo login credentials:');
    console.log('   Email: demo@osa.ro');
    console.log('   Password: demo123');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData()
    .then(async () => {
      console.log('\n✅ Seed script finished');
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('\n❌ Seed script failed:', error);
      await sequelize.close();
      process.exit(1);
    });
}

module.exports = seedData;
