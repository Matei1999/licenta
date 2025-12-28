const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Patient, User, AuditLog, Visit } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// ====== PUBLIC ROUTES (no authentication) ======

// @route   GET /api/patients/stats/dashboard
// @desc    Get dashboard statistics
// @access  Public
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Get all active patients with their visits
    const patients = await Patient.findAll({
      where: { status: 'Active' },
      include: [{
        model: Visit,
        as: 'visits',
        attributes: ['id', 'visitDate', 'ahi', 'cpapUsageMin', 'cpapCompliancePct']
      }]
    });

    const total = patients.length;
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

    patients.forEach(patient => {
      // Count severe cases (AHI >= 30 from latest visit)
      if (patient.visits && patient.visits.length > 0) {
        // Sort visits by date to get the most recent one
        const sortedVisits = patient.visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));
        const latestVisit = sortedVisits[0];
        
        if (latestVisit.ahi !== null && latestVisit.ahi !== undefined) {
          totalAhi += parseFloat(latestVisit.ahi);
          ahiCount++;
          
          if (latestVisit.ahi >= 30) {
            severe++;
          }

          // Histogram binning
          if (latestVisit.ahi < 30) histBins[0].count++;
          else histBins[1].count++;
        }

        // Count compliance (based on latest visit's cpapCompliancePct or cpapUsageMin)
        let compliancePercent = null;
        
        // Priority: use cpapCompliancePct if available, otherwise calculate from cpapUsageMin
        if (latestVisit.cpapCompliancePct !== null && latestVisit.cpapCompliancePct !== undefined) {
          compliancePercent = parseFloat(latestVisit.cpapCompliancePct);
        } else if (latestVisit.cpapUsageMin !== null && latestVisit.cpapUsageMin !== undefined) {
          compliancePercent = (latestVisit.cpapUsageMin / (24 * 60)) * 100;
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
      }
    });

    const avgAhi = ahiCount > 0 ? (totalAhi / ahiCount).toFixed(1) : '0.0';
    const avgCompliance = complianceCount > 0 ? Math.round(totalCompliance / complianceCount) : 0;

    res.json({
      total,
      severe,
      compliant,
      nonCompliant,
      avgAhi,
      avgCompliance,
      histBins,
      histTotal: patients.filter(p => (p.visits && p.visits.length > 0 && p.visits[0].ahi !== null && p.visits[0].ahi !== undefined)).length
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
        'county', 'locality', 'assignedDoctorId', 'createdAt'
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
      attributes: ['patientId', 'ahi', 'cpapCompliancePct', 'visitDate', 'createdAt'],
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
// @desc    Get all patients
// @access  Private
router.get('/', async (req, res) => {
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
      include: [{
        model: User,
        as: 'assignedDoctor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(patients);
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
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if patient with email already exists
    const existingPatient = await Patient.findOne({ where: { email: req.body.email } });
    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
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
// @desc    Search patient by CNP (admin only, caută după hash)
// @access  Private (admin only)
router.post('/search-cnp', async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: admin only' });
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
      attributes: ['patientId', 'ahi', 'visitDate'],
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
      const iahVal = v.ahi !== null && v.ahi !== undefined ? parseFloat(v.ahi) : null;
      if (iahVal === null || Number.isNaN(iahVal)) continue;
      seenPatients.add(pid);
      total++;
      if (iahVal < 30) bins[0].count++;
      else bins[1].count++;
    }

    res.json({ total, bins });
  } catch (err) {
    console.error('Error fetching IAH histogram:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
