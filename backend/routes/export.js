const express = require('express');
const router = express.Router();
const { Patient, Visit } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// Export patients to CSV with anonymization options
router.get('/patients', auth, async (req, res) => {
  try {
    const { 
      anonymizeNames = 'false', 
      removeCNP = 'false', 
      pseudonymize = 'false',
      includeVisits = 'true'
    } = req.query;

    const patients = await Patient.findAll({
      include: includeVisits === 'true' ? [{
        model: Visit,
        as: 'visits',
        order: [['visitDate', 'DESC']]
      }] : [],
      order: [['createdAt', 'DESC']]
    });

    // Generate CSV headers
    const headers = [
      pseudonymize === 'true' ? 'ID Subiect' : 'ID',
      anonymizeNames === 'false' ? 'Prenume' : null,
      anonymizeNames === 'false' ? 'Nume' : null,
      removeCNP === 'false' ? 'CNP' : null,
      'Data Nașterii',
      'Gen',
      'Vârstă',
      'Email',
      'Telefon',
      'Înălțime (cm)',
      'Greutate (kg)',
      'BMI',
      'Circumferință Gât (cm)',
      'Județ',
      'Localitate',
      'Stare Civilă',
      'Ocupație',
      'Educație',
      'Mediu',
      'STOP-BANG',
      'Epworth',
      'Poziție Somn',
      'HTA',
      'Diabet',
      'OSA Severe',
      'Status',
      'Data Creare'
    ].filter(h => h !== null);

    if (includeVisits === 'true') {
      headers.push(
        'Nr. Vizite',
        'Ultima Vizită',
        'IAH Ultim',
        'Severitate',
        'Complianță CPAP (%)',
        'Utilizare CPAP (h)',
        'Tip Mască'
      );
    }

    // Generate CSV rows
    const rows = patients.map((patient, index) => {
      const age = patient.dateOfBirth 
        ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      const comorbidities = patient.comorbidities || {};
      const hasHTN = comorbidities.cardiovascular?.includes('I10') || false;
      const hasDiabetes = comorbidities.metabolic?.some(c => c.startsWith('E11')) || false;
      
      let latestVisit = null;
      if (includeVisits === 'true' && patient.visits && patient.visits.length > 0) {
        latestVisit = patient.visits[0];
      }

      const getSeverity = (ahi) => {
        if (!ahi) return 'N/A';
        if (ahi < 5) return 'Normal';
        if (ahi < 15) return 'Ușor';
        if (ahi < 30) return 'Moderat';
        return 'Sever';
      };

      const row = [
        pseudonymize === 'true' ? `SUBJ-${String(index + 1).padStart(3, '0')}` : patient.id,
        anonymizeNames === 'false' ? patient.firstName : null,
        anonymizeNames === 'false' ? patient.lastName : null,
        removeCNP === 'false' ? patient.cnp : null,
        patient.dateOfBirth,
        patient.gender,
        age,
        patient.email,
        patient.phone,
        patient.heightCm,
        patient.weightKg,
        patient.bmi,
        patient.neckCircumferenceCm,
        patient.county,
        patient.locality,
        patient.maritalStatus,
        patient.occupation,
        patient.educationLevel,
        patient.environmentType,
        patient.stopBangScore,
        patient.epworthScore,
        patient.sleepPosition,
        hasHTN ? 'Da' : 'Nu',
        hasDiabetes ? 'Da' : 'Nu',
        patient.stopBangScore >= 5 && patient.epworthScore >= 10 ? 'Risc Înalt' : 'Risc Scăzut',
        patient.status,
        patient.createdAt
      ].filter((_, i) => headers[i] !== undefined);

      if (includeVisits === 'true') {
        const visitCount = patient.visits?.length || 0;
        const usageHours = latestVisit?.cpapUsageMin ? (latestVisit.cpapUsageMin / 60).toFixed(1) : 'N/A';
        
        row.push(
          visitCount,
          latestVisit?.visitDate || 'N/A',
          latestVisit?.ahi || 'N/A',
          latestVisit?.ahi ? getSeverity(latestVisit.ahi) : 'N/A',
          latestVisit?.cpapCompliancePct || 'N/A',
          usageHours,
          latestVisit?.maskType || 'N/A'
        );
      }

      return row;
    });

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          // Escape quotes and wrap in quotes if contains comma or quotes
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');

    // Set headers for file download
    const filename = `pacienti_osa_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    // Add BOM for Excel UTF-8 recognition
    res.write('\ufeff');
    res.write(csvContent);
    res.end();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Eroare la export', error: error.message });
  }
});

// Export visits to CSV
router.get('/visits', auth, async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.query;

    const whereClause = {};
    if (startDate) whereClause.visitDate = { [Op.gte]: startDate };
    if (endDate) whereClause.visitDate = { ...whereClause.visitDate, [Op.lte]: endDate };
    if (patientId) whereClause.patientId = patientId;

    const visits = await Visit.findAll({
      where: whereClause,
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['firstName', 'lastName', 'cnp']
      }],
      order: [['visitDate', 'DESC']]
    });

    const headers = [
      'ID Vizită',
      'Pacient',
      'CNP',
      'Data Vizită',
      'Clinician',
      'IAH',
      'IAH Rezidual',
      'Index Desaturare',
      'IAH NREM',
      'IAH REM',
      'SpO2 Min (%)',
      'SpO2 Max (%)',
      'SpO2 Mediu (%)',
      'T90 (%)',
      'T45 (%)',
      'Complianță CPAP (%)',
      'Complianță ≥4h (%)',
      'Utilizare (minute)',
      'Scurgeri 95p (L/min)',
      'Presiune 95p (cmH2O)',
      'Tip Mască',
      'Potrivire Bună',
      'Schimbare Mască',
      'Notițe'
    ];

    const rows = visits.map(visit => [
      visit.id,
      visit.patient ? `${visit.patient.firstName} ${visit.patient.lastName}` : 'N/A',
      visit.patient?.cnp || 'N/A',
      visit.visitDate,
      visit.clinician,
      visit.ahi,
      visit.ahiResidual,
      visit.desatIndex,
      visit.ahiNrem,
      visit.ahiRem,
      visit.spo2Min,
      visit.spo2Max,
      visit.spo2Mean,
      visit.t90,
      visit.t45,
      visit.cpapCompliancePct,
      visit.cpapCompliance4hPct,
      visit.cpapUsageMin,
      visit.cpapLeaks95p,
      visit.cpapPressure95p,
      visit.maskType,
      visit.maskFitGood ? 'Da' : 'Nu',
      visit.maskChange ? 'Da' : 'Nu',
      visit.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      )
    ].join('\n');

    const filename = `vizite_osa_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.write('\ufeff');
    res.write(csvContent);
    res.end();

  } catch (error) {
    console.error('Export visits error:', error);
    res.status(500).json({ message: 'Eroare la export vizite', error: error.message });
  }
});

module.exports = router;
