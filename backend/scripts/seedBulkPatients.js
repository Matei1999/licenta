const { connectDB } = require('../config/database');
const { Patient, Visit, User } = require('../models');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNamesMale = ['Andrei','Mihai','Bogdan','Ionut','Vlad','Radu','George','Alexandru','Daniel','Florin','Sorin','Cristian','Marian','Paul','Darius'];
const firstNamesFemale = ['Ana','Maria','Ioana','Elena','Roxana','Simona','Lidia','Camelia','Gabriela','Diana','Alexandra','Raluca','Bianca','Alina','Andreea'];
const lastNames = ['Popescu','Ionescu','Dumitrescu','Marinescu','Vasilescu','Georgescu','Stoian','Nedelcu','Radu','Ciocan','Moldovan','Petrescu','Popa','Antonescu','Dragan'];
const counties = ['Bucuresti','Cluj','Timis','Iasi','Brasov','Constanta','Prahova','Sibiu','Dolj','Bihor','Galati','Arad','Valcea','Mehedinti','Satu Mare'];

// Minimal ICD-10 pools per category
const ICD = {
  cardiovascular: ['I10','I10.1','I48','I50.9','I25.1'],
  metabolic: ['E11.9','E78.5','E66.9','E66.01'],
  respiratory: ['J45.9','J44.9','J84.9'],
  neurologic: ['I63.9','F41.9','F32.9','F03'],
  other: ['K21.9','E03.9','I26.9','N18.9']
};

function pickSome(arr, maxCount = 3) {
  const count = randInt(0, Math.min(maxCount, arr.length));
  const copy = arr.slice();
  const picked = [];
  for (let i = 0; i < count; i++) {
    const idx = randInt(0, copy.length - 1);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
}

function pad2(n) { return String(n).padStart(2,'0'); }

// Simplified Romanian CNP generator (synthetic, not real)
function generateCNP(dob, gender) {
  const year = dob.getFullYear();
  const yy = pad2(year % 100);
  const mm = pad2(dob.getMonth() + 1);
  const dd = pad2(dob.getDate());
  let S;
  if (year >= 2000) S = gender === 'Male' ? 5 : 6; else S = gender === 'Male' ? 1 : 2;
  const JJ = pad2(randInt(1, 52));
  const NNN = pad2(randInt(1, 999)).padStart(3, '0');
  const partial = `${S}${yy}${mm}${dd}${JJ}${NNN}`;
  // Simple control digit (not official) just to have 13 digits
  const C = String(randInt(0,9));
  return partial + C;
}

async function seedBulk(count = 1000) {
  await connectDB();
  console.log('✅ DB connected');

  // Ensure we have a doctor for visits
  let doctor = await User.findOne({ where: { role: 'doctor' } });
  if (!doctor) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    doctor = await User.create({ name: 'Dr. Seeder', email: 'seeder@osa.ro', password: hashedPassword, role: 'doctor' });
  }

  let createdPatients = 0;
  for (let i = 0; i < count; i++) {
    const gender = Math.random() < 0.5 ? 'Male' : 'Female';
    const firstName = gender === 'Male' ? firstNamesMale[randInt(0, firstNamesMale.length - 1)]
                                       : firstNamesFemale[randInt(0, firstNamesFemale.length - 1)];
    const lastName = lastNames[randInt(0, lastNames.length - 1)];
    const year = randInt(1955, 2005);
    const month = randInt(1, 12);
    const day = randInt(1, 28); // simple
    const dob = new Date(`${year}-${pad2(month)}-${pad2(day)}`);

    const email = `patient${Date.now()}_${i}@test.com`;
    const phone = `07${randInt(10000000, 99999999)}`;
    const county = counties[randInt(0, counties.length - 1)];
    const locality = county;

    const cnp = generateCNP(dob, gender);

    const comorbidities = {
      cardiovascular: pickSome(ICD.cardiovascular),
      metabolic: pickSome(ICD.metabolic),
      respiratory: pickSome(ICD.respiratory),
      neurologic: pickSome(ICD.neurologic),
      other: pickSome(ICD.other)
    };

    const patientData = {
      firstName,
      lastName,
      cnp,
      dateOfBirth: dob,
      gender,
      email,
      phone,
      heightCm: randInt(155, 190),
      weightKg: randInt(60, 130),
      neckCircumferenceCm: randInt(30, 48),
      county,
      locality,
      maritalStatus: Math.random() < 0.5 ? 'Necăsătorit/ă' : 'Căsătorit/ă',
      occupation: 'Pacient demo',
      educationLevel: Math.random() < 0.5 ? 'Liceal' : 'Universitar',
      environmentType: Math.random() < 0.7 ? 'Urban' : 'Rural',
      stopBangScore: randInt(2, 8),
      epworthScore: randInt(4, 20),
      sleepPosition: Math.random() < 0.5 ? 'Spate' : 'Lateral',
      comorbidities,
      status: 'Active'
    };

    try {
      const patient = await Patient.create(patientData);
      createdPatients++;

      // Create 1-2 visits per patient (ensure at least one, to avoid '-')
      const visitCount = randInt(1, 2);
      for (let v = 0; v < visitCount; v++) {
        // Ensure only moderate (15-29.9) or severe (>=30) AHI values
        const ahi = Number((Math.random() * 40 + 15).toFixed(1)); // 15.0 - 55.0
        const usageHours = Number((Math.random() * 8).toFixed(1));
        const cpapUsageMin = Math.round(usageHours * 60);
        const compliance = Math.round((usageHours / 8) * 100);
        const visitDateObj = new Date();
        visitDateObj.setMonth(visitDateObj.getMonth() - randInt(0, 12));
        const visitDate = visitDateObj.toISOString().slice(0, 10); // YYYY-MM-DD for DATEONLY

        const maskTypes = ['Nazală', 'Oronazală', 'Pillows (perne nazale)', 'Pernă Nazală', 'Facială completă'];
        const maskType = maskTypes[randInt(0, maskTypes.length - 1)];

        await Visit.create({
          patientId: patient.id,
          clinician: doctor.name,
          recordedById: doctor.id,
          visitDate,
          ahi,
          cpapUsageMin,
          cpapCompliancePct: compliance,
          maskType,
          spo2Min: 80 + randInt(0, 8),
          spo2Max: 95 + randInt(0, 3),
          spo2Mean: Number((90 + Math.random() * 5).toFixed(2)),
          desatIndex: Number((ahi * (0.6 + Math.random() * 0.5)).toFixed(2)),
          t90: Number((Math.random() * 20).toFixed(2)),
          ahiResidual: Number((ahi * 0.25).toFixed(1)),
          notes: 'Vizită generată automat'
        });
      }

      if (i % 100 === 0) {
        console.log(`Progress: ${i}/${count}`);
      }
    } catch (e) {
      console.error('Seed error for one patient:', e.message);
    }
  }

  const totalPatients = await Patient.count();
  const totalVisits = await Visit.count();
  console.log(`\n🎉 Seed complete: created ~${createdPatients} patients`);
  console.log(`📊 Totals -> Patients: ${totalPatients}, Visits: ${totalVisits}`);
}

seedBulk(1000).then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
