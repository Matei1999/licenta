const db = require('./models');

async function checkStats() {
  try {
    const patients = await db.Patient.findAll({
      where: { status: 'Active' },
      include: [{
        model: db.Visit,
        as: 'visits',
        attributes: ['visitDate', 'ahi', 'cpapUsageMin', 'cpapCompliancePct']
      }]
    });

    const total = patients.length;
    let severe = 0;
    let compliant = 0;
    let nonCompliant = 0;

    patients.forEach(patient => {
      if (patient.visits && patient.visits.length > 0) {
        const sortedVisits = patient.visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
        const latestVisit = sortedVisits[0];
        
        if (latestVisit.ahi !== null && latestVisit.ahi !== undefined) {
          if (latestVisit.ahi >= 30) {
            severe++;
          }
        }

        let compliancePercent = null;
        if (latestVisit.cpapCompliancePct !== null && latestVisit.cpapCompliancePct !== undefined) {
          compliancePercent = parseFloat(latestVisit.cpapCompliancePct);
        } else if (latestVisit.cpapUsageMin !== null && latestVisit.cpapUsageMin !== undefined) {
          compliancePercent = (latestVisit.cpapUsageMin / (24 * 60)) * 100;
        }
        
        if (compliancePercent !== null) {
          if (compliancePercent >= 70) {
            compliant++;
          } else {
            nonCompliant++;
          }
        }
      }
    });

    console.log(`\n📊 DASHBOARD STATS:`);
    console.log(`Total Patients: ${total}`);
    console.log(`Severe Cases (AHI >= 30): ${severe}`);
    console.log(`Compliant (≥70%): ${compliant}`);
    console.log(`Non-Compliant (<70%): ${nonCompliant}`);
    console.log(`\nSample data:`);
    patients.slice(0, 3).forEach(p => {
      if (p.visits && p.visits.length > 0) {
        const v = p.visits[0];
        console.log(`  ${p.firstName} ${p.lastName}: AHI=${v.ahi}, Compliance%=${v.cpapCompliancePct}`);
      }
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkStats();
