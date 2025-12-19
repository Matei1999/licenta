const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Patient, User, AuditLog } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let where = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by name or email
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
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

    res.json(patient);
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
      'assignedDoctorId'  // ID-urile sunt tehnice, doar valorile umane contează
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
      
      if (req.body[key] !== oldValues[key] && req.body[key] !== undefined) {
        // Convert values to strings for comparison and storage
        const oldVal = oldValues[key] === null || oldValues[key] === undefined ? 'N/A' : String(oldValues[key]);
        const newVal = req.body[key] === null || req.body[key] === undefined ? 'N/A' : String(req.body[key]);
        
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

module.exports = router;
