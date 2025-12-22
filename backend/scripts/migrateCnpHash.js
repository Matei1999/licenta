// Script Node.js pentru migrare hash CNP pentru pacienții existenți
const { Patient } = require('../models');
const { decryptCNP } = require('../utils/cnpCrypto');
const crypto = require('crypto');

async function migrateCnpHash() {
  const patients = await Patient.findAll();
  for (const patient of patients) {
    if (patient.cnp) {
      try {
        const cnpDecrypted = decryptCNP(patient.cnp);
        const hash = crypto.createHash('sha256').update(cnpDecrypted).digest('hex');
        await patient.update({ cnp_hash: hash });
        console.log(`Updated hash for patient ${patient.id}`);
      } catch (e) {
        console.error(`Failed for patient ${patient.id}:`, e.message);
      }
    }
  }
  console.log('Migration complete!');
}

migrateCnpHash().then(() => process.exit());
