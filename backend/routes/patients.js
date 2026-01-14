const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Patient, User, AuditLog, Visit } = require('../models');
const { Op, Sequelize } = require('sequelize');
const auth = require('../middleware/auth');

// ====== PUBLIC ROUTES (no authentication) ======

// @route   GET /api/patients/stats/dashboard
// @desc    Get dashboard statistics
// @access  Public
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Get total number of patients
    const totalPatients = await Patient.count();

    // Get latest visit per patient
    const visits = await Visit.findAll({
      attributes: ['id', 'patientId', 'visitDate', 'ahi', 'cpapUsageMin', 'cpapCompliancePct', 'polysomnography'],
      where: {
        visitDate: {
          [Op.in]: Sequelize.literal(`(
            SELECT MAX("visitDate") FROM "Visits" v2 
            WHERE v2."patientId" = "Visit"."patientId"
          )`)
        }
      },
      raw: true
    });

    // Deduplicate by patientId (in case multiple visits have same max date)
    const uniqueVisitsByPatient = new Map();
    visits.forEach(v => {
      if (!uniqueVisitsByPatient.has(v.patientId)) {
        uniqueVisitsByPatient.set(v.patientId, v);
      }
    });
    const patients = Array.from(uniqueVisitsByPatient.values());

    let severe = 0;
    let compliant = 0;
    let nonCompliant = 0;
    let totalAhi = 0;
    let ahiCount = 0;
    let totalCompliance = 0;
    let complianceCount = 0;

    const histBins = [
      { key: 'moderate', label: '15–29.9', count: 0 },
      { key: 'severe', label: '≥30', count: 0 }
    ];

    patients.forEach(visit => {
      // Get AHI from polysomnography or direct field
      const ahi = visit.polysomnography?.ahi ?? visit.ahi;
      
      if (ahi !== null && ahi !== undefined) {
        totalAhi += parseFloat(ahi);
        ahiCount++;
        
        if (ahi >= 30) {
          severe++;
        }

        // Histogram binning
        if (ahi >= 15 && ahi < 30) {
          histBins[0].count++;
        } else if (ahi >= 30) {
          histBins[1].count++;
        }
      }

      // Count compliance
      let compliancePercent = null;
      
      if (visit.cpapCompliancePct !== null && visit.cpapCompliancePct !== undefined) {
        compliancePercent = parseFloat(visit.cpapCompliancePct);
      } else if (visit.cpapUsageMin !== null && visit.cpapUsageMin !== undefined) {
        compliancePercent = (visit.cpapUsageMin / (24 * 60)) * 100;
      }
      
      if (compliancePercent !== null) {
        totalCompliance += compliancePercent;
        complianceCount++;

        if (compliancePercent >= 70) {
          compliant++;
        } else {
          nonCompliant++;
        }
      }
    });

    const avgAhi = ahiCount > 0 ? (totalAhi / ahiCount).toFixed(1) : '0.0';
    const avgCompliance = complianceCount > 0 ? Math.round(totalCompliance / complianceCount) : 0;

    // Count patients with valid AHI for histogram
    const patientsWithAhi = patients.filter(p => {
      const ahi = p.polysomnography?.ahi ?? p.ahi;
      return ahi !== null && ahi !== undefined;
    }).length;

    res.json({
      total: totalPatients,
      severe,
      compliant,
      nonCompliant,
      avgAhi,
      avgCompliance,
      histBins,
      histTotal: patientsWithAhi
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====== PROTECTED ROUTES (require authentication) ======
// All routes from here on require authentication
router.use(auth);

// Place specific routes BEFORE parameterized routes like '/:id'
// At this point, stats and histogram routes are already defined above.

// @route   GET /api/patients/with-latest
// @desc    Get patients with their latest visit summary (single call)
// @access  Private
router.get('/with-latest', async (req, res) => {
  try {
    const { status, search } = req.query;
    let where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const patients = await Patient.findAll({
      where,
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'status',
        'county', 'locality', 'assignedDoctorId', 'createdAt',
        // Include fields useful for list fallbacks
        'sasoForm', 'cpapData'
      ],
      include: [{
        model: User,
        as: 'assignedDoctor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Fetch all visits ordered by latest first
    const visits = await Visit.findAll({
      attributes: ['patientId', 'ahi', 'cpapCompliancePct', 'visitDate', 'createdAt', 'polysomnography'],
      order: [['visitDate', 'DESC'], ['createdAt', 'DESC']]
    });

    const latestByPatient = new Map();
    for (const v of visits) {
      const pid = v.patientId;
      if (!pid) continue;
      if (!latestByPatient.has(pid)) latestByPatient.set(pid, v);
    }

    const result = patients.map(p => {
      const pObj = p.toJSON();
      const v = latestByPatient.get(p.id);
      pObj.latestVisit = v ? {
        ahi: v.ahi,
        polysomnography: v.polysomnography,
        cpapCompliancePct: v.cpapCompliancePct,
        visitDate: v.visitDate
      } : null;
      return pObj;
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching patients with latest visit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients
// @desc    Get all patients with pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;
    
    let where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'assignedDoctor',
        attributes: ['id', 'name', 'email']
      }],
      include: [{
        model: Visit,
        as: 'visits',
        attributes: ['id', 'visitDate', 'ahi', 'cpapCompliancePct', 'polysomnography'],
        separate: true,
        order: [['visitDate', 'DESC']],
        limit: 1 // Only latest visit
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    // Enrich with latest visit data
    const enriched = rows.map(p => {
      const pObj = p.toJSON();
      const latestVisit = pObj.visits && pObj.visits.length > 0 ? pObj.visits[0] : null;
      return {
        ...pObj,
        latestVisit
      };
    });

    res.json({
      data: enriched,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'assignedDoctor',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Decriptează CNP-ul pentru doctor/admin
    const { decryptCNP } = require('../utils/cnpCrypto');
    const patientObj = patient.toJSON();
    patientObj.cnp = patient.cnp ? decryptCNP(patient.cnp) : null;

    res.json(patientObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private
router.post('/', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔴 Validation errors:', JSON.stringify(errors.array(), null, 2));
      console.log('🔴 Request body:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if patient with email already exists (only when email is provided)
    if (req.body.email) {
      const existingPatient = await Patient.findOne({ where: { email: req.body.email } });
      if (existingPatient) {
        return res.status(400).json({ message: 'Patient with this email already exists' });
      }
    }

    const patient = await Patient.create(req.body);

    // Create audit log for new patient
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'create',
      entityType: 'patient',
      entityId: patient.id,
      changes: [{
        field: 'patient',
        oldValue: null,
        newValue: `${patient.firstName} ${patient.lastName}`
      }],
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(patient);
  } catch (err) {
    console.error('Error creating patient:', err.message || err);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Track changes for audit log
    const oldValues = patient.toJSON();
    const changes = [];
    
    // Lista de câmpuri tehnice care NU trebuie înregistrate în audit
    const excludedFields = [
      'createdAt', 
      'updatedAt', 
      'id', 
      'userId',
      'assignedDoctorId',  // ID-urile sunt tehnice, doar valorile umane contează
      'cnp',              // CNP este sensibil GDPR
      'cnp_hash'          // Hash-ul CNP nu trebuie afișat în istoric
    ];
    
    // Dacă se modifică CNP, nu înregistra și dateOfBirth (se calculează automat din CNP)
    if (req.body.cnp && req.body.dateOfBirth) {
      excludedFields.push('dateOfBirth');
    }
    
    // Compare each field
    Object.keys(req.body).forEach(key => {
      // Ignoră câmpurile tehnice
      if (excludedFields.includes(key)) {
        return;
      }
      
      if (req.body[key] !== undefined) {
        // Serialize objects for comparison (especially JSONB fields)
        const oldVal = oldValues[key] === null || oldValues[key] === undefined 
          ? '-' 
          : (typeof oldValues[key] === 'object' ? JSON.stringify(oldValues[key]) : String(oldValues[key]));
        
        const newVal = req.body[key] === null || req.body[key] === undefined 
          ? '-' 
          : (typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : String(req.body[key]));
        
        // Skip if old value was empty and now it's being filled for the first time
        const wasEmpty = oldVal === '-' || oldVal === '' || oldVal === 'null' || oldVal === '{}' || oldVal === '[]';
        const isNowFilled = newVal !== '-' && newVal !== '' && newVal !== 'null' && newVal !== '{}' && newVal !== '[]';
        
        if (wasEmpty && isNowFilled) {
          // Don't log when filling empty fields
          return;
        }
        
        if (oldVal !== newVal) {
          changes.push({
            field: key,
            oldValue: oldVal,
            newValue: newVal
          });
        }
      }
    });

    // Update patient
    await patient.update(req.body);
    
    // Create audit log entry if there are changes
    if (changes.length > 0) {
      try {
        await AuditLog.create({
          userId: req.user.id,
          userName: req.user.name,
          action: 'update',
          entityType: 'patient',
          entityId: patient.id,
          changes: changes,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
        // Don't fail the request if audit log fails
      }
    }
    
    // Reload with associations
    await patient.reload({
      include: [{
        model: User,
        as: 'assignedDoctor',
        attributes: ['id', 'name', 'email']
      }]
    });

    // Sync corrected fields into the latest visit so overlays reflect edits
    try {
      const latestVisit = await Visit.findOne({
        where: { patientId: patient.id },
        order: [['visitDate', 'DESC'], ['createdAt', 'DESC']]
      });

      if (latestVisit) {
        const visitUpdate = {};

        // Comorbidities: direct copy
        if (req.body.comorbidities) {
          visitUpdate.comorbidities = req.body.comorbidities;
        }

        // Behavioral: reverse-map patient -> visit
        if (req.body.behavioral) {
          const b = req.body.behavioral || {};
          const vb = { ...(latestVisit.behavioral || {}) };

          if (b.avgSleepDuration !== undefined) vb.sleepHoursPerNight = b.avgSleepDuration;
          if (b.bedtimeTypical !== undefined) vb.bedtimeTypical = b.bedtimeTypical;
          if (b.waketimeTypical !== undefined) vb.wakeTimeTypical = b.waketimeTypical;
          if (b.sleepVariability !== undefined) vb.sleepVariability = b.sleepVariability;
          if (b.fragmentedSleep !== undefined) vb.fragmentedSleep = b.fragmentedSleep;
          if (b.hasNaps !== undefined) vb.hasNaps = b.hasNaps;
          if (b.napFrequency !== undefined) vb.napFrequency = b.napFrequency;
          if (b.napDurationMin !== undefined) vb.napDuration = b.napDurationMin;

          // Smoking status normalization
          if (b.smokingStatus !== undefined) {
            const reverseSmokingMap = {
              'Nefumător': 'nefumător',
              'Fumător activ': 'fumător_activ',
              'Fumător pasiv': 'fumător_pasiv',
              'Fost fumător (>6 luni abstinență)': 'fost_fumător'
            };
            vb.smokingStatus = reverseSmokingMap[b.smokingStatus] || b.smokingStatus;
          }
          if (b.packsPerDay !== undefined) vb.packsPerDay = b.packsPerDay;
          if (b.smokingYears !== undefined) vb.smokingYears = b.smokingYears;

          // Alcohol frequency normalization
          if (b.alcoholFrequency !== undefined) {
            const reverseAlcoholMap = {
              'Niciodată': 'niciodată',
              'Ocazional': 'rar',
              'Săptămânal': 'moderat',
              'Zilnic': 'zilnic'
            };
            vb.alcoholFrequency = reverseAlcoholMap[b.alcoholFrequency] || b.alcoholFrequency;
          }
          if (b.alcoholQuantity !== undefined) vb.alcoholAmount = b.alcoholQuantity;
          if (b.caffeineIntake !== undefined) vb.caffeineCount = b.caffeineIntake;

          // Physical activity
          if (b.physicalActivityLevel !== undefined) {
            const reverseActivityMap = { 'Sedentar': 'sedentar', 'Moderat': 'moderat', 'Intens': 'intens' };
            vb.physicalActivity = reverseActivityMap[b.physicalActivityLevel] || b.physicalActivityLevel;
          }
          if (b.physicalActivityHours !== undefined) vb.physicalActivityHours = b.physicalActivityHours;

          // Sleep position
          if (b.sleepPositionPrimary !== undefined) {
            const reversePosMap = { 'Dorsal': 'dorsal', 'Lateral': 'lateral', 'Mixt': 'mixt', 'Abdomen': 'abdomen' };
            vb.sleepPosition = reversePosMap[b.sleepPositionPrimary] || b.sleepPositionPrimary;
          }
          if (b.positionalOSA !== undefined) vb.positionalOSA = b.positionalOSA;

          visitUpdate.behavioral = vb;

          // ORL (stored under visit.orlHistory): map from patient.behavioral*
          const vh = { ...(latestVisit.orlHistory || {}) };
          if (b.mallampati !== undefined) vh.mallampatiClass = b.mallampati;
          if (b.septumDeviation !== undefined) vh.septumDeviation = b.septumDeviation;
          if (b.macroglossia !== undefined) vh.macroglossia = b.macroglossia;
          if (b.tonsillarHypertrophy !== undefined) vh.tonsilHypertrophy = b.tonsillarHypertrophy;
          if (b.retrognathia !== undefined) vh.retrognathia = b.retrognathia;
          if (b.nasalObstruction !== undefined) vh.nasalObstruction = b.nasalObstruction;
          if (b.chronicRhinitis !== undefined) vh.chronicRhinitis = b.chronicRhinitis;
          if (b.priorENTSurgery !== undefined) {
            vh.orlSurgery = !!b.priorENTSurgery;
            vh.orlSurgeryDetails = b.priorENTSurgery || '';
          }
          visitUpdate.orlHistory = vh;
        }

        // Psychosocial (SAQLI): copy
        if (req.body.psychosocial) {
          visitUpdate.psychosocial = { ...(latestVisit.psychosocial || {}), ...req.body.psychosocial };
        }

        // Biomarkers: copy
        if (req.body.biomarkers) {
          visitUpdate.biomarkers = { ...(latestVisit.biomarkers || {}), ...req.body.biomarkers };
        }

        // CPAP device data: copy
        if (req.body.cpapData) {
          visitUpdate.cpapData = { ...(latestVisit.cpapData || {}), ...req.body.cpapData };
        }

        // Polysomnography: copy
        if (req.body.polysomnography) {
          visitUpdate.polysomnography = { ...(latestVisit.polysomnography || {}), ...req.body.polysomnography };
        }

        // Screening: copy
        if (req.body.screening) {
          visitUpdate.screening = { ...(latestVisit.screening || {}), ...req.body.screening };
        }

        if (Object.keys(visitUpdate).length > 0) {
          await latestVisit.update(visitUpdate);
        }
      }
    } catch (syncErr) {
      console.error('Error syncing patient edits to latest visit:', syncErr);
      // Do not fail patient update if visit sync fails
    }

    res.json(patient);
  } catch (err) {
    console.error('Error updating patient:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientName = `${patient.firstName} ${patient.lastName}`;
    
    // Create audit log before deletion
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      action: 'delete',
      entityType: 'patient',
      entityId: patient.id,
      changes: [{
        field: 'patient',
        oldValue: patientName,
        newValue: null
      }],
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    await patient.destroy();

    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/patients/:id/audit-logs
// @desc    Delete all audit logs for a patient
// @access  Private (admin/doctor only)
router.delete('/:id/audit-logs', async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Șterge toate log-urile pentru acest pacient
    const deletedCount = await AuditLog.destroy({
      where: {
        entityType: 'patient',
        entityId: req.params.id
      }
    });

    res.json({ 
      message: 'Audit logs deleted successfully',
      deletedCount 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/cnp
// @desc    Get decrypted CNP for a patient (admin only)
// @access  Private (admin only)
router.get('/:id/cnp', async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin only' });
    }
    const patient = await Patient.findByPk(req.params.id, { attributes: ['cnp'] });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Decrypt CNP only for admin
    const { decryptCNP } = require('../utils/cnpCrypto');
    const decryptedCNP = patient.cnp ? decryptCNP(patient.getDataValue('cnp')) : null;
    res.json({ cnp: decryptedCNP });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patients/search-cnp
// @desc    Search patient by CNP (authenticated users)
// @access  Private
router.post('/search-cnp', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { cnp } = req.body;
    if (!cnp || typeof cnp !== 'string' || cnp.length !== 13) {
      return res.status(400).json({ message: 'CNP invalid' });
    }
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(cnp).digest('hex');
    // Căutare după hash
    const patient = await Patient.findOne({ where: { cnp_hash: hash } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json({ id: patient.id, firstName: patient.firstName, lastName: patient.lastName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/iah-histogram
// @desc    Get IAH histogram using latest visit per patient
// @access  Private
router.get('/iah-histogram', async (req, res) => {
  try {
    const { Visit } = require('../models');

    // Fetch all visits ordered by latest first
    const visits = await Visit.findAll({
      attributes: ['patientId', 'ahi', 'polysomnography', 'visitDate'],
      order: [['visitDate', 'DESC']]
    });

    const seenPatients = new Set();
    const bins = [
      { key: 'moderate', label: '15–29.9', count: 0 },
      { key: 'severe', label: '≥30', count: 0 }
    ];

    let total = 0;
    for (const v of visits) {
      const pid = v.patientId;
      if (!pid || seenPatients.has(pid)) continue; // only latest per patient
      const ahi = v.polysomnography?.ahi ?? v.ahi;
      const iahVal = ahi !== null && ahi !== undefined ? parseFloat(ahi) : null;
      if (iahVal === null || Number.isNaN(iahVal)) continue;
      seenPatients.add(pid);
      total++;
      if (iahVal >= 15 && iahVal < 30) bins[0].count++;
      else if (iahVal >= 30) bins[1].count++;
    }

    res.json({ total, bins });
  } catch (err) {
    console.error('Error fetching IAH histogram:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/reports/complete
// @desc    Get optimized complete report with pagination
// @access  Private
router.get('/reports/complete', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Get patients with pagination
    const { count, rows: patients } = await Patient.findAndCountAll({
      where: { status: 'Active' },
      include: [{
        model: Visit,
        as: 'visits',
        attributes: ['id', 'visitDate', 'ahi', 'cpapCompliancePct', 'polysomnography'],
        separate: true,
        order: [['visitDate', 'DESC']],
        limit: 1 // Only get latest visit
      }],
      limit,
      offset,
      raw: false
    });

    // Process data
    const reportPatients = [];
    const summaryData = {
      iahValues: [],
      desatValues: [],
      spo2Values: [],
      t90Values: [],
      complianceValues: [],
      compliantCount: 0
    };

    for (const patient of patients) {
      if (!patient.visits || patient.visits.length === 0) continue;
      
      const latestVisit = patient.visits[0];
      const ahi = latestVisit.polysomnography?.ahi ?? latestVisit.ahi;
      const desatIndex = latestVisit.polysomnography?.desatIndex ?? null;
      const spo2Mean = latestVisit.polysomnography?.spo2Mean ?? null;
      const t90 = latestVisit.polysomnography?.t90 ?? null;
      const compliance = latestVisit.cpapCompliancePct ?? null;

      reportPatients.push({
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        latestIAH: ahi ?? null,
        latestDesatIndex: desatIndex,
        latestSpO2Mean: spo2Mean,
        latestT90: t90,
        latestCompliance: compliance,
        isCompliant: compliance !== null && compliance >= 70,
        avgCompliance: compliance
      });

      // Collect values for averaging
      if (ahi !== null && ahi !== undefined) summaryData.iahValues.push(Number(ahi));
      if (desatIndex !== null && desatIndex !== undefined) summaryData.desatValues.push(Number(desatIndex));
      if (spo2Mean !== null && spo2Mean !== undefined) summaryData.spo2Values.push(Number(spo2Mean));
      if (t90 !== null && t90 !== undefined) summaryData.t90Values.push(Number(t90));
      if (compliance !== null && compliance !== undefined) {
        summaryData.complianceValues.push(Number(compliance));
        if (compliance >= 70) summaryData.compliantCount++;
      }
    }

    // Calculate averages safely
    const calcAvg = (arr) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '0.0';

    res.json({
      summary: {
        totalPatients: count, // Total in database
        patientsInPage: reportPatients.length, // Patients in current page
        avgIAH: calcAvg(summaryData.iahValues),
        avgDesatIndex: calcAvg(summaryData.desatValues),
        avgSpO2Mean: calcAvg(summaryData.spo2Values),
        avgT90: calcAvg(summaryData.t90Values),
        avgCompliance: calcAvg(summaryData.complianceValues),
        complianceRate: summaryData.complianceValues.length > 0 
          ? ((summaryData.compliantCount / summaryData.complianceValues.length) * 100).toFixed(1) 
          : 0,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        pageSize: limit
      },
      patients: reportPatients
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/reports/individual
// @desc    Get optimized individual report with all visits per patient
// @access  Private
router.get('/reports/individual', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const selectedPatientId = req.query.patientId; // Optional filter
    const startDate = req.query.startDate; // Optional date filter
    const endDate = req.query.endDate; // Optional date filter

    // Build where clause for patients
    const whereClause = { status: 'Active' };
    if (selectedPatientId && selectedPatientId !== 'all') {
      whereClause.id = selectedPatientId;
    }

    // Build where clause for visits if date range is provided
    const visitWhereClause = {};
    if (startDate && endDate) {
      visitWhereClause.visitDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get patients with all their visits
    const { count, rows: patients } = await Patient.findAndCountAll({
      where: whereClause,
      include: [{
        model: Visit,
        as: 'visits',
        attributes: ['id', 'visitDate', 'cpapCompliancePct', 'cpapCompliance4hPct', 'cpapComplianceLessThan4hPct', 'ahi', 'ahiResidual', 'polysomnography'],
        where: Object.keys(visitWhereClause).length > 0 ? visitWhereClause : undefined,
        order: [['visitDate', 'DESC']]
      }],
      limit,
      offset,
      raw: false
    });

    // Process data
    const reportPatients = [];
    let totalCompliant = 0;
    let totalNonCompliant = 0;

    for (const patient of patients) {
      if (!patient.visits || patient.visits.length === 0) continue;
      
      const visits = patient.visits;
      const latestVisit = visits[0];
      
      // Calculate average compliance across all visits
      const avgCompliance = visits.reduce((sum, v) => sum + (v.cpapCompliancePct || 0), 0) / visits.length;
      const isCompliant = avgCompliance >= 70;

      if (isCompliant) totalCompliant++;
      else totalNonCompliant++;

      reportPatients.push({
        patientId: patient.id,
        patient: `${patient.firstName} ${patient.lastName}`,
        visitCount: visits.length,
        avgCompliance: avgCompliance.toFixed(1),
        latestCompliance: latestVisit.cpapCompliancePct ?? null,
        latestCompliance4h: latestVisit.cpapCompliance4hPct ?? null,
        latestComplianceLess4h: latestVisit.cpapComplianceLessThan4hPct ?? null,
        latestIAH: latestVisit.polysomnography?.ahi ?? latestVisit.ahi ?? null,
        latestAHIResidual: latestVisit.polysomnography?.ahiResidual ?? latestVisit.ahiResidual ?? null,
        isCompliant,
        trend: visits.length > 1 
          ? (latestVisit.cpapCompliancePct > visits[visits.length - 1].cpapCompliancePct ? 'up' : 'down')
          : 'stable'
      });
    }

    const totalValidPatients = reportPatients.length;

    res.json({
      summary: {
        total: totalValidPatients,
        compliant: totalCompliant,
        nonCompliant: totalNonCompliant,
        complianceRate: totalValidPatients > 0 ? ((totalCompliant / totalValidPatients) * 100).toFixed(1) : 0,
        currentPage: page,
        totalPages: Math.ceil(totalValidPatients / limit), // Use totalValidPatients for pagination
        pageSize: limit,
        totalPatients: totalValidPatients // Show only patients with visits
      },
      patients: reportPatients
    });
  } catch (error) {
    console.error('Error generating individual report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
