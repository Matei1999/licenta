const { connectDB } = require('../config/database');
const { Patient, Visit, sequelize } = require('../models');

async function main() {
  await connectDB();
  console.log('✅ DB connected');

  // Get latest visit per patient by visitDate desc then createdAt desc
  const visits = await Visit.findAll({
    attributes: ['patientId', 'ahi', 'visitDate', 'createdAt'],
    order: [['visitDate', 'DESC'], ['createdAt', 'DESC']]
  });
  const latestByPatient = new Map();
  for (const v of visits) {
    if (!v.patientId) continue;
    if (!latestByPatient.has(v.patientId)) latestByPatient.set(v.patientId, v);
  }

  const totalPatients = await Patient.count();
  const withVisit = latestByPatient.size;
  const noVisit = totalPatients - withVisit;
  let normal = 0, mild = 0, moderate = 0, severe = 0, noAhi = 0;

  for (const v of latestByPatient.values()) {
    const ahi = v.ahi == null ? null : parseFloat(v.ahi);
    if (ahi == null || Number.isNaN(ahi)) { noAhi++; continue; }
    if (ahi < 5) normal++;
    else if (ahi < 15) mild++;
    else if (ahi < 30) moderate++;
    else severe++;
  }

  console.log('\n📊 Severities (latest visit):');
  console.log(`Total patients: ${totalPatients}`);
  console.log(`With visits: ${withVisit}`);
  console.log(`No visits: ${noVisit}`);
  console.log(`Normal (<5): ${normal}`);
  console.log(`Mild (5-14.9): ${mild}`);
  console.log(`Moderate (15-29.9): ${moderate}`);
  console.log(`Severe (≥30): ${severe}`);
  console.log(`With visit but AHI null: ${noAhi}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
