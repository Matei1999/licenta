const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { SleepData, Patient, User } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/sleep-data/:patientId
// @desc    Get sleep data for a patient
// @access  Private
router.get('/:patientId', async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    let where = { patientId: req.params.patientId };

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }

    const sleepData = await SleepData.findAll({
      where,
      include: [{
        model: User,
        as: 'recordedBy',
        attributes: ['id', 'name', 'email']
      }],
      order: [['date', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(sleepData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sleep-data/entry/:id
// @desc    Get single sleep data entry
// @access  Private
router.get('/entry/:id', async (req, res) => {
  try {
    const sleepData = await SleepData.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'recordedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }

    res.json(sleepData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/sleep-data
// @desc    Add new sleep data entry
// @access  Private
router.post('/', [
  body('patient').notEmpty().withMessage('Patient ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('sleepDuration').isFloat({ min: 0 }).withMessage('Valid sleep duration is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify patient exists
    const patient = await Patient.findByPk(req.body.patient);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Add recordedBy field and rename patient to patientId
    const sleepDataObj = {
      ...req.body,
      patientId: req.body.patient,
      recordedById: req.user.userId
    };
    delete sleepDataObj.patient;

    const sleepData = await SleepData.create(sleepDataObj);

    const populatedData = await SleepData.findByPk(sleepData.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'recordedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(populatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/sleep-data/:id
// @desc    Update sleep data entry
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let sleepData = await SleepData.findByPk(req.params.id);

    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }

    // Update the record
    const updateData = { ...req.body };
    if (updateData.patient) {
      updateData.patientId = updateData.patient;
      delete updateData.patient;
    }
    
    await sleepData.update(updateData);
    
    // Reload with associations
    await sleepData.reload({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'recordedBy',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(sleepData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/sleep-data/:id
// @desc    Delete sleep data entry
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const sleepData = await SleepData.findByPk(req.params.id);

    if (!sleepData) {
      return res.status(404).json({ message: 'Sleep data not found' });
    }

    await sleepData.destroy();

    res.json({ message: 'Sleep data deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sleep-data/:patientId/stats
// @desc    Get sleep statistics for a patient
// @access  Private
router.get('/:patientId/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sleepData = await SleepData.findAll({
      where: {
        patientId: req.params.patientId,
        date: {
          [Op.gte]: startDate
        }
      }
    });

    if (sleepData.length === 0) {
      return res.json({
        message: 'No data available for this period',
        stats: null
      });
    }

    // Calculate statistics
    const stats = {
      totalEntries: sleepData.length,
      averageSleepDuration: 0,
      averageAHI: 0,
      averageCPAPUsage: 0,
      complianceRate: 0,
      averageSleepQuality: 0
    };

    let totalSleepDuration = 0;
    let totalAHI = 0;
    let totalCPAPUsage = 0;
    let compliantDays = 0;
    let totalSleepQuality = 0;
    let ahiCount = 0;
    let cpapCount = 0;
    let qualityCount = 0;

    sleepData.forEach(entry => {
      totalSleepDuration += entry.sleepDuration || 0;
      
      if (entry.ahiScore !== undefined && entry.ahiScore !== null) {
        totalAHI += entry.ahiScore;
        ahiCount++;
      }
      
      if (entry.cpapUsage?.hoursUsed !== undefined) {
        totalCPAPUsage += entry.cpapUsage.hoursUsed;
        cpapCount++;
        if (entry.cpapUsage.compliance) compliantDays++;
      }
      
      if (entry.sleepQuality) {
        totalSleepQuality += entry.sleepQuality;
        qualityCount++;
      }
    });

    stats.averageSleepDuration = (totalSleepDuration / sleepData.length).toFixed(2);
    stats.averageAHI = ahiCount > 0 ? (totalAHI / ahiCount).toFixed(2) : 0;
    stats.averageCPAPUsage = cpapCount > 0 ? (totalCPAPUsage / cpapCount).toFixed(2) : 0;
    stats.complianceRate = cpapCount > 0 ? ((compliantDays / cpapCount) * 100).toFixed(2) : 0;
    stats.averageSleepQuality = qualityCount > 0 ? (totalSleepQuality / qualityCount).toFixed(2) : 0;

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
