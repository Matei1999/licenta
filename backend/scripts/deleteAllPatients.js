const { connectDB } = require('../config/database');
const { Patient, Visit, AuditLog } = require('../models');

async function main() {
  await connectDB();
  console.log('✅ DB connected');

  const beforePatients = await Patient.count();
  const beforeVisits = await Visit.count();
  console.log(`Before -> Patients: ${beforePatients}, Visits: ${beforeVisits}`);

  // Clean patient-related audit logs (entityType = 'patient')
  try {
    const deletedLogs = await AuditLog.destroy({ where: { entityType: 'patient' } });
    console.log(`Deleted patient audit logs: ${deletedLogs}`);
  } catch (e) {
    console.log('Skipping audit log cleanup:', e.message);
  }

  // Delete all patients (visits cascade)
  const deleted = await Patient.destroy({ where: {} });
  console.log(`Deleted patients: ${deleted}`);

  const afterPatients = await Patient.count();
  const afterVisits = await Visit.count();
  console.log(`After -> Patients: ${afterPatients}, Visits: ${afterVisits}`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
