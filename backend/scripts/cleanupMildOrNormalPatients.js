const { connectDB } = require('../config/database');
const { sequelize, Patient, Visit, User } = require('../models');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const firstNamesMale = ['Andrei','Mihai','Bogdan','Ionut','Vlad','Radu','George','Alexandru','Daniel','Florin','Sorin','Cristian','Marian','Paul','Darius'];
const firstNamesFemale = ['Ana','Maria','Ioana','Elena','Roxana','Simona','Lidia','Camelia','Gabriela','Diana','Alexandra','Raluca','Bianca','Alina','Andreea'];
const lastNames = ['Popescu','Ionescu','Dumitrescu','Marinescu','Vasilescu','Georgescu','Stoian','Nedelcu','Radu','Ciocan','Moldovan','Petrescu','Popa','Antonescu','Dragan'];
const counties = ['Bucuresti','Cluj','Timis','Iasi','Brasov','Constanta','Prahova','Sibiu','Dolj','Bihor','Galati','Arad','Valcea','Mehedinti','Satu Mare'];

function pad2(n) { return String(n).padStart(2,'0'); }

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
  const C = String(randInt(0,9));
  return partial + C;
}

async function createModerateOrSeverePatient(doctor) {
  const gender = Math.random() < 0.5 ? 'Male' : 'Female';
  const firstName = gender === 'Male' ? firstNamesMale[randInt(0, firstNamesMale.length - 1)] : firstNamesFemale[randInt(0, firstNamesFemale.length - 1)];
  const lastName = lastNames[randInt(0, lastNames.length - 1)];
  const year = randInt(1955, 2005);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  const dob = new Date(`${year}-${pad2(month)}-${pad2(day)}`);

  const email = `patient_replace_${Date.now()}_${Math.random().toString(36).slice(2,7)}@test.com`;
  const phone = `07${randInt(10000000, 99999999)}`;
  const county = counties[randInt(0, counties.length - 1)];
  const locality = county;
  const cnp = generateCNP(dob, gender);

  const patient = await Patient.create({
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
    stopBangScore: randInt(5, 8),
    epworthScore: randInt(8, 20),
    sleepPosition: Math.random() < 0.5 ? 'Spate' : 'Lateral',
    status: 'Active'
  });

  // Create at least 1 visit with AHI >= 15
  const visitDateObj = new Date();
  visitDateObj.setMonth(visitDateObj.getMonth() - randInt(0, 12));
  const visitDate = visitDateObj.toISOString().slice(0, 10);
  const ahi = Number((Math.random() * 40 + 15).toFixed(1)); // 15 - 55
  const usageHours = Number((Math.random() * 8).toFixed(1));
  const cpapUsageMin = Math.round(usageHours * 60);
  const compliance = Math.round((usageHours / 8) * 100);
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
    notes: 'Înlocuire pacient (moderate/severe)'
  });

  return patient.id;
}

async function main() {
  await connectDB();
  console.log('✅ DB connected');

  // Ensure a doctor exists
  let doctor = await User.findOne({ where: { role: 'doctor' } });
  if (!doctor) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('doctor123', 10);
    doctor = await User.create({ name: 'Dr. Seeder', email: 'seeder@osa.ro', password: hashedPassword, role: 'doctor' });
  }

  // Find latest visit per patient and mark those with AHI < 15
  console.log('🔎 Identific pacienții cu AHI < 15 la ultima vizită sau sasoForm = Ușoară...');
  // Determine latest visit per patient (by visitDate desc, then createdAt desc)
  const visits = await Visit.findAll({
    attributes: ['patientId', 'ahi', 'visitDate', 'createdAt'],
    order: [['visitDate', 'DESC'], ['createdAt', 'DESC']]
  });

  const seen = new Set();
  const toRemove = [];
  for (const v of visits) {
    const pid = v.patientId;
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const ahiVal = v.ahi !== null && v.ahi !== undefined ? parseFloat(v.ahi) : null;
    if (ahiVal !== null && ahiVal < 15) {
      toRemove.push(pid);
    }
  }

  // Also include patients explicitly labeled as mild via sasoForm = 'Ușoară'
  const mildBySaso = await Patient.findAll({ where: { sasoForm: 'Ușoară' }, attributes: ['id'] });
  for (const p of mildBySaso) {
    const id = p.id || p.get('id');
    if (!toRemove.includes(id)) toRemove.push(id);
  }

  // Try to include patients with osaClassification persisted as Normal/Ușoară (if column exists)
  try {
    const [rows] = await sequelize.query('SELECT id FROM "Patients" WHERE "osaClassification" IN (\'Normal\', \'Ușoară\')');
    if (Array.isArray(rows)) {
      for (const r of rows) {
        const id = r.id;
        if (id && !toRemove.includes(id)) toRemove.push(id);
      }
    }
  } catch (e) {
    // Column might not exist; ignore
  }

  console.log(`🗑️ De șters (Normal/Ușoară): ${toRemove.length}`);

  // Remove marked patients (their visits cascade)
  let removed = 0;
  for (const id of toRemove) {
    try {
      await Patient.destroy({ where: { id } });
      removed++;
    } catch (e) {
      console.error('Eroare la ștergere pacient', id, e.message);
    }
  }

  // Create replacements with moderate/severe
  console.log(`➕ Creez înlocuitori moderat/sever: ${removed}`);
  let created = 0;
  for (let i = 0; i < removed; i++) {
    try {
      await createModerateOrSeverePatient(doctor);
      created++;
    } catch (e) {
      console.error('Eroare la creare înlocuitor:', e.message);
    }
  }

  const totalPatients = await Patient.count();
  const totalVisits = await Visit.count();
  console.log(`\n✅ Cleanup complet. Șters: ${removed}, Adăugat: ${created}`);
  console.log(`📊 Totale -> Pacienți: ${totalPatients}, Vizite: ${totalVisits}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
