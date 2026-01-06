require('dotenv').config();
const { sequelize, Patient, Visit, User } = require('./models');
const bcrypt = require('bcryptjs');

// Utility functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomBool = (probability = 0.5) => Math.random() < probability;

// Date românești realiste
const NUME = ['Popescu', 'Ionescu', 'Popa', 'Pop', 'Radu', 'Dumitrescu', 'Stan', 'Stoica', 'Gheorghe', 'Marin', 'Tudor', 'Dinu', 'Barbu', 'Nicolescu', 'Vasile', 'Petre', 'Andrei', 'Constantin', 'Mihai', 'Alexandru', 'Cristea', 'Vlad', 'Moraru', 'Constantinescu', 'Stanciu', 'Matei', 'Drăgan', 'Neagu', 'Marinescu', 'Georgescu'];
const PRENUME_BARBATI = ['Ion', 'Gheorghe', 'Vasile', 'Nicolae', 'Constantin', 'Dumitru', 'Marin', 'Petre', 'Alexandru', 'Mihai', 'Adrian', 'Cristian', 'Andrei', 'Dan', 'Ionuț', 'Florin', 'Marius', 'Bogdan', 'Ștefan', 'Radu', 'Gabriel', 'Daniel', 'Costel', 'Lucian', 'Sorin'];
const PRENUME_FEMEI = ['Maria', 'Elena', 'Ana', 'Ioana', 'Daniela', 'Georgiana', 'Andreea', 'Mihaela', 'Cristina', 'Alina', 'Alexandra', 'Diana', 'Carmen', 'Gabriela', 'Laura', 'Monica', 'Adriana', 'Simona', 'Roxana', 'Oana', 'Nicoleta', 'Raluca', 'Irina', 'Claudia', 'Valentina'];
const JUDETE = ['București', 'Cluj', 'Timiș', 'Iași', 'Constanța', 'Brașov', 'Galați', 'Craiova', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare'];

// CNP generator
function generateCNP(gender, birthYear, birthMonth, birthDay) {
  const genderDigit = gender === 'Male' ? (birthYear >= 2000 ? '5' : '1') : (birthYear >= 2000 ? '6' : '2');
  const year = String(birthYear).slice(-2).padStart(2, '0');
  const month = String(birthMonth).padStart(2, '0');
  const day = String(birthDay).padStart(2, '0');
  const county = String(randomInt(1, 52)).padStart(2, '0');
  const order = String(randomInt(1, 999)).padStart(3, '0');
  const cnpWithoutChecksum = `${genderDigit}${year}${month}${day}${county}${order}`;
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cnpWithoutChecksum[i]) * weights[i];
  const checksum = sum % 11 === 10 ? 1 : sum % 11;
  return cnpWithoutChecksum + checksum;
}

// Generare visit complet
function generateVisit(patientId, visitIndex, hasCPAPTreatment) {
  const daysAgo = randomInt(30, 365 * 3);
  const visitDate = new Date();
  visitDate.setDate(visitDate.getDate() - daysAgo);

  const polysomnography = {
    ahi: randomFloat(3, 85, 1),
    ahiNrem: randomFloat(2, 70, 1),
    ahiRem: randomFloat(3, 90, 1),
    ahiResidual: hasCPAPTreatment ? randomFloat(0, 10, 1) : null,
    desatIndex: randomFloat(1, 90, 1),
    spo2Min: randomFloat(75, 95, 1),
    spo2Max: randomFloat(95, 100, 1),
    spo2Mean: randomFloat(92, 97, 1),
    t90: randomFloat(0, 30, 1),
    t45: randomFloat(0, 15, 1),
    hypoxicBurden: randomFloat(0, 120, 1)
  };

  const screening = {
    sasoForm: randomChoice(['moderată', 'severă']),
    stopBangScore: randomInt(2, 8),
    epworthScore: randomInt(0, 24)
  };

  const behavioral = {
    sleepDuration: randomChoice(['5-6 ore', '6-7 ore', '7-8 ore', '8-9 ore']),
    fragmentedSleep: randomBool(0.6),
    hasNaps: randomBool(0.4),
    positionalOSA: randomBool(0.3)
  };

  const orlHistory = {
    septumDeviation: randomBool(0.3),
    tonsilHypertrophy: randomBool(0.2),
    macroglossia: randomBool(0.15),
    uvulaHypertrophy: randomBool(0.1),
    retrognathia: randomBool(0.1),
    orlSurgery: randomBool(0.05),
    nasalObstruction: randomBool(0.4),
    chronicRhinitis: randomBool(0.3)
  };

  const drivingRisk = {
    isProfessionalDriver: randomBool(0.1),
    drowsinessWhileDriving: randomBool(0.3),
    resumedDrivingAfterTreatment: hasCPAPTreatment ? randomBool(0.7) : false
  };

  return {
    patientId,
    visitDate: visitDate.toISOString().split('T')[0],
    clinician: randomChoice(['Dr. Popescu', 'Dr. Ionescu', 'Dr. Vasile', 'Dr. Radu']),
    screening,
    polysomnography,
    behavioral,
    orlHistory,
    drivingRisk,
    cpapCompliancePct: hasCPAPTreatment ? randomInt(40, 95) : null,
    cpapCompliance4hPct: hasCPAPTreatment ? randomInt(50, 90) : null,
    cpapComplianceLessThan4hPct: hasCPAPTreatment ? randomInt(5, 50) : null,
    cpapComplianceLessThan4h: hasCPAPTreatment ? randomBool(0.3) : false,
    cpapUsageMin: hasCPAPTreatment ? randomInt(180, 480) : null,
    cpapLeaks95p: hasCPAPTreatment ? randomFloat(5, 30, 1) : null,
    cpapPressure95p: hasCPAPTreatment ? randomFloat(8, 15, 1) : null,
    maskType: hasCPAPTreatment ? randomChoice(['Nazală', 'Oronazală', 'Pillows (perne nazale)']) : null
  };
}

async function reseedDatabase() {
  try {
    console.log('🔄 Starting database reseed...\n');

    // 1. Șterge toți pacienții (va șterge și vizitele prin CASCADE)
    console.log('🗑️  Deleting all existing patients and visits...');
    await Visit.destroy({ where: {}, truncate: true, cascade: true });
    await Patient.destroy({ where: {}, truncate: true, cascade: true });
    console.log('✅ Database cleared!\n');

    // 2. Generează 2000 pacienți
    console.log('👥 Generating 2000 patients with visits...\n');
    
    for (let i = 1; i <= 2000; i++) {
      const gender = randomChoice(['Male', 'Female']);
      const birthYear = randomInt(1950, 2005);
      const birthMonth = randomInt(1, 12);
      const birthDay = randomInt(1, 28);
      const cnp = generateCNP(gender, birthYear, birthMonth, birthDay);
      
      const lastName = randomChoice(NUME);
      const firstName = gender === 'Male' ? randomChoice(PRENUME_BARBATI) : randomChoice(PRENUME_FEMEI);
      
      const heightCm = randomInt(150, 195);
      const weightKg = randomInt(55, 130);
      const bmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
      
      const patient = await Patient.create({
        firstName,
        lastName,
        cnp,
        dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
        gender,
        phone: `07${randomInt(10000000, 99999999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}${randomInt(100, 999)}@email.ro`,
        county: randomChoice(JUDETE),
        locality: randomChoice(['Municipiu', 'Oraș']),
        heightCm,
        weightKg,
        bmi: parseFloat(bmi),
        neckCircumferenceCm: randomInt(34, 48),
        maritalStatus: randomChoice(['Necăsătorit/ă', 'Căsătorit/ă', 'Divorțat/ă', 'Văduv/ă']),
        occupation: randomChoice(['Angajat', 'Freelancer', 'Pensionar', 'Șomer', 'Student', 'Muncitor', 'Manager', 'Profesor']),
        educationLevel: randomChoice(['Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Postuniversitar']),
        environmentType: randomChoice(['Urban', 'Rural', 'Suburban']),
        householdSize: randomInt(1, 6),
        childrenCount: randomInt(0, 4),
        status: 'Active',
        medicalHistory: {
          conditions: randomBool(0.5) ? ['Hipertensiune arterială', 'Diabet zaharat tip 2'] : [],
          medications: randomBool(0.4) ? ['Enalapril 10mg', 'Metformin 500mg'] : [],
          allergies: randomBool(0.2) ? ['Penicilină'] : []
        },
        sleepApneaDetails: {
          diagnosisDate: `${randomInt(2020, 2025)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          severity: randomChoice(['Ușoară', 'Moderată', 'Severă']),
          symptoms: randomChoice([
            ['Sforăit puternic', 'Apnee observată', 'Somnolență zilnică excesivă'],
            ['Sforăit', 'Treziri nocturne frecvente', 'Dificultăți de concentrare'],
            ['Sforăit intermitent', 'Oboseală matinală']
          ])
        },
        comorbidities: {
          cardiovascular: randomBool(0.4) ? ['I10', 'I25.1'] : [],
          metabolic: randomBool(0.3) ? ['E11.9', 'E78.5'] : [],
          respiratory: randomBool(0.2) ? ['J44.9'] : [],
          neurologic: randomBool(0.1) ? ['G47.3'] : [],
          other: []
        },
        stopBangScore: randomInt(3, 8),
        epworthScore: randomInt(5, 20),
        sleepPosition: randomChoice(['Spate', 'Lateral', 'Abdomen', 'Mixtă']),
        sasoForm: randomChoice(['Ușoară', 'Moderată', 'Severă'])
      });

      // Generează 1-5 vizite per pacient
      const numVisits = randomInt(1, 5);
      const hasCPAPTreatment = randomBool(0.7);
      
      for (let v = 0; v < numVisits; v++) {
        await Visit.create(generateVisit(patient.id, v, hasCPAPTreatment));
      }

      if (i % 100 === 0) {
        console.log(`  ✓ Created ${i}/2000 patients...`);
      }
    }

    console.log('\n✅ Successfully created 2000 patients with complete visit data!');
    console.log('📊 Database is ready for testing!\n');

  } catch (error) {
    console.error('❌ Error during reseed:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

reseedDatabase();
