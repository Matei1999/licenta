const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Patient, User } = require('../models');
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

    // Update patient
    await patient.update(req.body);
    
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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

    await patient.destroy();

    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
