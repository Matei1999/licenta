const { sequelize, Patient, Visit, User } = require('./models');
const bcrypt = require('bcryptjs');

// Utility functions pentru generare date realiste
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[randomInt(0, arr.length - 1)];
const randomBool = (probability = 0.5) => Math.random() < probability;

// Date realiste românești
const NUME = ['Popescu', 'Ionescu', 'Popa', 'Pop', 'Radu', 'Dumitrescu', 'Stan', 'Stoica', 'Gheorghe', 'Marin', 'Tudor', 'Dinu', 'Barbu', 'Nicolescu', 'Vasile', 'Petre', 'Andrei', 'Constantin', 'Mihai', 'Alexandru', 'Cristea', 'Vlad', 'Moraru', 'Constantinescu', 'Stanciu', 'Matei', 'Drăgan', 'Neagu', 'Marinescu', 'Georgescu'];
const PRENUME_BARBATI = ['Ion', 'Gheorghe', 'Vasile', 'Nicolae', 'Constantin', 'Dumitru', 'Marin', 'Petre', 'Alexandru', 'Mihai', 'Adrian', 'Cristian', 'Andrei', 'Dan', 'Ionuț', 'Florin', 'Marius', 'Bogdan', 'Ștefan', 'Radu', 'Gabriel', 'Daniel', 'Costel', 'Lucian', 'Sorin'];
const PRENUME_FEMEI = ['Maria', 'Elena', 'Ana', 'Ioana', 'Daniela', 'Georgiana', 'Andreea', 'Mihaela', 'Cristina', 'Alina', 'Alexandra', 'Diana', 'Carmen', 'Gabriela', 'Laura', 'Monica', 'Adriana', 'Simona', 'Roxana', 'Oana', 'Nicoleta', 'Raluca', 'Irina', 'Claudia', 'Valentina'];
const JUDETE = ['București', 'Cluj', 'Timiș', 'Iași', 'Constanța', 'Brașov', 'Galați', 'Craiova', 'Ploiești', 'Oradea', 'Brăila', 'Arad', 'Pitești', 'Sibiu', 'Bacău', 'Târgu Mureș', 'Baia Mare', 'Buzău', 'Botoșani', 'Satu Mare'];
const LOCALITATI = ['Municipiu', 'Oraș', 'Sectorul 1', 'Sectorul 2', 'Sectorul 3', 'Sectorul 4', 'Centru', 'Nord', 'Sud'];
const OCUPATII = ['Inginer', 'Profesor', 'Medic', 'Contabil', 'Șofer', 'Vânzător', 'Manager', 'IT Specialist', 'Economist', 'Funcționar public', 'Tehnician', 'Electrician', 'Constructor', 'Pensionar', 'Fără ocupație'];
const EDUCATIE = ['Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Postuniversitar'];
const MEDICAMENTE = ['Ramipril', 'Amlodipină', 'Metformin', 'Atorvastatină', 'Levotirozină', 'Losartan', 'Bisoprolol', 'Simvastatină', 'Indapamidă', 'Perindopril'];

// Generare CNP valid românesc
function generateCNP(gender, birthYear, birthMonth, birthDay) {
  const genderDigit = gender === 'Male' ? (birthYear >= 2000 ? '5' : '1') : (birthYear >= 2000 ? '6' : '2');
  const year = String(birthYear).slice(-2).padStart(2, '0');
  const month = String(birthMonth).padStart(2, '0');
  const day = String(birthDay).padStart(2, '0');
  const county = String(randomInt(1, 52)).padStart(2, '0');
  const order = String(randomInt(1, 999)).padStart(3, '0');
  
  const cnpWithoutChecksum = `${genderDigit}${year}${month}${day}${county}${order}`;
  
  // Calculate checksum
  const weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpWithoutChecksum[i]) * weights[i];
  }
  const checksum = sum % 11 === 10 ? 1 : sum % 11;
  
  return cnpWithoutChecksum + checksum;
}

// Generare pacient complet
function generatePatient(index) {
  const gender = randomChoice(['Male', 'Female']);
  const birthYear = randomInt(1950, 2005);
  const birthMonth = randomInt(1, 12);
  const birthDay = randomInt(1, 28);
  const age = 2026 - birthYear;
  
  const lastName = randomChoice(NUME);
  const firstName = gender === 'Male' ? randomChoice(PRENUME_BARBATI) : randomChoice(PRENUME_FEMEI);
  const cnp = generateCNP(gender, birthYear, birthMonth, birthDay);
  
  const heightCm = gender === 'Male' ? randomInt(160, 195) : randomInt(150, 180);
  const weightKg = randomFloat(50, 130, 1);
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const neckCircumferenceCm = gender === 'Male' ? randomInt(35, 50) : randomInt(32, 45);
  
  const hasOSA = randomBool(0.75); // 75% au OSA
  const ahi = hasOSA ? randomFloat(5, 85, 1) : randomFloat(0, 4.9, 1);
  const severity = ahi < 5 ? 'Normal' : ahi < 15 ? 'Ușoară' : ahi < 30 ? 'Moderată' : 'Severă';
  
  const hasCPAP = hasOSA && ahi >= 15 && randomBool(0.7); // 70% din cei cu OSA moderată/severă au CPAP
  const compliance = hasCPAP ? randomFloat(30, 100, 1) : null;
  
  return {
    firstName,
    lastName,
    cnp,
    dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
    age,
    gender,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Date.now()}${randomInt(1, 999)}@email.ro`,
    phone: `+407${randomInt(10000000, 99999999)}`,
    heightCm,
    weightKg,
    bmi: parseFloat(bmi.toFixed(1)),
    neckCircumferenceCm,
    county: randomChoice(JUDETE),
    locality: randomChoice(LOCALITATI),
    maritalStatus: randomChoice(['Necăsătorit/ă', 'Căsătorit/ă', 'Divorțat/ă', 'Văduv/ă']),
    occupation: randomChoice(OCUPATII),
    educationLevel: randomChoice(EDUCATIE),
    environmentType: randomChoice(['Urban', 'Rural']),
    householdSize: randomInt(1, 6),
    childrenCount: randomInt(0, 4),
    stopBangScore: randomInt(0, 8),
    epworthScore: randomInt(0, 24),
    sleepPosition: randomChoice(['Spate', 'Lateral', 'Abdomen', 'Mixtă']),
    snoring: randomBool(0.8),
    snoringLoudness: randomChoice(['Ușor', 'Moderat', 'Tare', 'Foarte tare']),
    nightAwakenings: randomInt(0, 10),
    dayTimeSleepiness: randomBool(0.6),
    concentrationDifficulty: randomBool(0.5),
    morningHeadaches: randomBool(0.3),
    // OSA data
    ahi,
    osaSeverity: severity,
    cpapCompliance: compliance,
    // Comorbidități
    hypertension: randomBool(0.4),
    diabetes: randomBool(0.25),
    dyslipidemia: randomBool(0.35),
    obesity: bmi >= 30,
    cardiovascularDisease: randomBool(0.15),
    // Stil de viață
    smoking: randomBool(0.3),
    packetsPerDay: randomBool(0.3) ? randomFloat(0.5, 2, 1) : null,
    alcoholFrequency: randomChoice(['Niciodată', 'Ocazional', 'Săptămânal', 'Zilnic']),
    // Medicație
    medications: Array.from({ length: randomInt(0, 4) }, () => randomChoice(MEDICAMENTE)),
    consentSigned: randomBool(0.95),
    consentDate: `2025-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`
  };
}

// Generare vizită completă
function generateVisit(patientData, visitNumber) {
  const monthsAgo = visitNumber * randomInt(1, 4); // Vizite la 1-4 luni distanță
  const visitDate = new Date(2025, 11 - monthsAgo, randomInt(1, 28)); // Din decembrie 2025 înapoi
  
  const ahi = patientData.ahi + randomFloat(-5, 5, 1);
  const desatIndex = ahi * randomFloat(0.7, 1.3, 1);
  const spo2Mean = randomFloat(88, 98, 1);
  const t90 = randomFloat(0, 25, 1);
  
  const hasCPAP = patientData.cpapCompliance !== null;
  const cpapPressure = hasCPAP ? randomFloat(6, 15, 1) : null;
  const cpapCompliance = hasCPAP ? patientData.cpapCompliance + randomFloat(-10, 10, 1) : null;
  const cpapAvgUsageHours = hasCPAP ? randomFloat(3, 9, 1) : null;
  // Derivă complianța ≥4h și <4h dacă avem utilizare medie
  let cpapCompliance4hPct = null;
  let cpapComplianceLessThan4hPct = null;
  if (hasCPAP && cpapCompliance !== null) {
    const pct = Math.min(100, Math.max(0, cpapCompliance));
    if (cpapAvgUsageHours !== null && cpapAvgUsageHours >= 4) {
      cpapCompliance4hPct = Math.round(pct);
      cpapComplianceLessThan4hPct = Math.max(0, 100 - cpapCompliance4hPct);
    } else {
      cpapCompliance4hPct = 0;
      cpapComplianceLessThan4hPct = Math.round(pct);
    }
  }
  
  // AHI rezidual (dacă pacientul are CPAP, simulăm o scădere semnificativă)
  const ahiResidual = hasCPAP ? Math.max(0, randomFloat(0, 5, 1)) : null;
  
  return {
    visitDate: visitDate.toISOString().split('T')[0],
    visitType: visitNumber === 0 ? 'Consultație inițială' : 'Control periodic',
    // Screening
    screening: {
      sasoForm: randomChoice(['moderată', 'severă']),
      stopBangScore: patientData.stopBangScore + randomInt(-1, 1),
      epworthScore: patientData.epworthScore + randomInt(-2, 2)
    },
    // Polysomnografie
    polysomnography: {
      ahi: Math.max(0, ahi),
      desatIndex: Math.max(0, desatIndex),
      spo2Mean: Math.max(70, Math.min(100, spo2Mean)),
      ahiResidual: ahiResidual,
      t90: Math.max(0, t90),
      t45: randomFloat(0, 5, 1),
      hypoxicBurden: randomFloat(50, 300, 1)
    },
    // CPAP
    cpapPressure,
    cpapCompliancePct: cpapCompliance ? Math.min(100, Math.max(0, cpapCompliance)) : null,
    cpapCompliance4hPct,
    cpapComplianceLessThan4hPct,
    cpapComplianceLessThan4h: hasCPAP ? (cpapAvgUsageHours !== null && cpapAvgUsageHours < 4) : false,
    cpapAvgUsageHours,
    // Populate individual column as well so rapoarte individuale pot afisa
    ahiResidual: ahiResidual,
    // Vitale
    bloodPressureSystolic: randomInt(110, 160),
    bloodPressureDiastolic: randomInt(70, 100),
    heartRate: randomInt(55, 95),
    weight: patientData.weightKg + randomFloat(-3, 3, 1),
    height: patientData.heightCm,
    bmi: patientData.bmi + randomFloat(-1, 1, 1),
    neckCircumference: patientData.neckCircumferenceCm + randomFloat(-1, 1, 1),
    // Comportament
    behavioral: {
      smoking: patientData.smoking,
      packetsPerDay: patientData.packetsPerDay,
      packYears: patientData.packetsPerDay ? Math.floor(patientData.packetsPerDay * (patientData.age - 18)) : null,
      alcoholFrequency: patientData.alcoholFrequency
    },
    // Comorbidități
    comorbidities: {
      hypertension: patientData.hypertension,
      diabetes: patientData.diabetes,
      dyslipidemia: patientData.dyslipidemia,
      obesity: patientData.obesity,
      cardiovascularDisease: patientData.cardiovascularDisease,
      otherText: randomBool(0.2) ? 'Hipotiroidism, astm bronșic' : ''
    },
    // Note clinice
    clinicalNotes: visitNumber === 0 
      ? `Consultație inițială. Pacient prezintă simptome OSA: sforăit, apnee observată, somnolență diurnă. IAH: ${ahi.toFixed(1)}. Recomandat tratament CPAP.`
      : `Control ${visitNumber}. ${hasCPAP ? `Complianță CPAP: ${cpapCompliance?.toFixed(1)}%. ` : ''}IAH: ${ahi.toFixed(1)}. Evoluție ${randomChoice(['favorabilă', 'staționară', 'necesită ajustare tratament'])}.`
  };
}

async function seed2000Patients() {
  try {
    console.log('🗑️  Golire bază de date...');
    
    // Drop toate tabelele (pentru PostgreSQL)
    await Visit.destroy({ where: {}, truncate: { cascade: true } });
    await Patient.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });
    
    console.log('✅ Bază de date goală');
    
    // Creează utilizatori demo
    console.log('👤 Creare utilizatori demo...');
    
    await User.create({
      name: 'Dr. Demo OSA',
      email: 'demo@osa.ro',
      password: 'demo123',
      role: 'doctor'
    });
    
    const demoUser = await User.create({
      name: 'Matei',
      email: 'test@test.com',
      password: 'romania12',
      role: 'doctor'
    });
    
    console.log('✅ Utilizatori demo creați');
    
    // Generare pacienți
    console.log('🌱 Generare 2000 pacienți...');
    const batchSize = 50;
    const totalPatients = 2000;
    let createdCount = 0;
    
    for (let i = 0; i < totalPatients; i += batchSize) {
      const batch = [];
      const patientMetadata = []; // Păstrăm metadata pentru vizite
      const endIndex = Math.min(i + batchSize, totalPatients);
      
      for (let j = i; j < endIndex; j++) {
        const patientData = generatePatient(j);
        // Păstrăm metadata-ul pentru generarea vizitelor
        patientMetadata.push({
          cnp: patientData.cnp,
          ahi: patientData.ahi,
          cpapCompliance: patientData.cpapCompliance,
          stopBangScore: patientData.stopBangScore,
          epworthScore: patientData.epworthScore
        });
        // Scoatem câmpurile care nu sunt în model din datele pacientului
        const { ahi, osaSeverity, cpapCompliance, snoring, snoringLoudness, nightAwakenings, 
                dayTimeSleepiness, concentrationDifficulty, morningHeadaches, hypertension, 
                diabetes, dyslipidemia, obesity, cardiovascularDisease, smoking, packetsPerDay, 
                alcoholFrequency, medications, consentSigned, consentDate, ...dbPatientData } = patientData;
        batch.push(dbPatientData);
      }
      
      // Inserare batch
      const patients = await Patient.bulkCreate(batch, {
        validate: true,
        individualHooks: true
      });
      
      // Generare vizite pentru fiecare pacient
      const visitsToCreate = [];
      for (let idx = 0; idx < patients.length; idx++) {
        const patient = patients[idx];
        const metadata = patientMetadata[idx];
        const numVisits = randomInt(1, 5); // 1-5 vizite per pacient
        
        for (let v = 0; v < numVisits; v++) {
          const visitData = generateVisit(metadata, v);
          visitsToCreate.push({
            patientId: patient.id,
            ...visitData
          });
        }
      }
      
      // Inserare vizite în batch
      await Visit.bulkCreate(visitsToCreate);
      
      createdCount += patients.length;
      const progress = ((createdCount / totalPatients) * 100).toFixed(1);
      console.log(`  ⏳ ${createdCount}/${totalPatients} pacienți (${progress}%)`);
    }
    
    console.log('\n✅ Bază de date populată cu succes!');
    console.log(`📊 Total pacienți: ${createdCount}`);
    
    // Statistici
    const totalVisits = await Visit.count();
    
    console.log(`📊 Total vizite: ${totalVisits}`);
    console.log(`✅ Seeding completat! Database ready for testing.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Eroare la populare:', error);
    process.exit(1);
  }
}

// Rulare
seed2000Patients();
