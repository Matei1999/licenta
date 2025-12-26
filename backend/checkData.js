const db = require('./models');

async function checkData() {
  try {
    const patients = await db.Patient.findAll({
      include: [{
        model: db.Visit,
        as: 'visits',
        attributes: ['visitDate', 'ahi', 'cpapCompliancePct', 'cpapUsageMin'],
        order: [['visitDate', 'DESC']]
      }],
      order: [['id', 'ASC']],
      limit: 10
    });

    console.log(`\n📊 Total Patients: ${patients.length}`);
    console.log(`📊 Total Visits: ${patients.reduce((sum, p) => sum + (p.visits ? p.visits.length : 0), 0)}\n`);

    patients.forEach(p => {
      console.log(`✅ Patient: ${p.firstName} ${p.lastName} (ID: ${p.id}), Visits: ${p.visits ? p.visits.length : 0}`);
      if (p.visits && p.visits.length > 0) {
        p.visits.forEach(v => {
          console.log(`   📅 ${v.visitDate} | AHI: ${v.ahi} | Compliance%: ${v.cpapCompliancePct} | UsageMin: ${v.cpapUsageMin}`);
        });
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
