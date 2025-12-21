// Script de migrare pentru a popula cnp_hash pentru pacienții existenți
const { Patient } = require('../models');
const crypto = require('crypto');

async function migrateCnpHash() {
  const patients = await Patient.findAll();
  let updated = 0;
  for (const patient of patients) {
    // Dacă există CNP și nu există hash sau hash-ul nu corespunde
    if (patient.cnp && (!patient.cnp_hash || patient.cnp_hash.length !== 64)) {
      // Decriptăm CNP-ul (atenție: getDataValue returnează criptatul)
      const { decryptCNP } = require('../utils/cnpCrypto');
      let cnpPlain = null;
      try {
        cnpPlain = decryptCNP(patient.getDataValue('cnp'));
      } catch (e) {
        console.error('Nu s-a putut decripta CNP-ul pentru pacientul', patient.id);
        continue;
      }
      if (cnpPlain && cnpPlain.length === 13) {
        const hash = crypto.createHash('sha256').update(cnpPlain).digest('hex');
        patient.cnp_hash = hash;
        await patient.save();
        updated++;
        console.log(`Actualizat hash pentru pacientul ${patient.id}`);
      }
    }
  }
  console.log(`Total pacienți actualizați: ${updated}`);
}

migrateCnpHash().then(() => process.exit(0));
