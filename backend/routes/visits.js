const express = require('express');
const router = express.Router();
const { Visit, Patient } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// @route   GET /api/visits
// @desc    Get all visits with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { patientId, startDate, endDate, clinician, limit = 50 } = req.query;
    
    const where = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate[Op.gte] = startDate;
      if (endDate) where.visitDate[Op.lte] = endDate;
    }
    
    if (clinician) {
      where.clinician = { [Op.iLike]: `%${clinician}%` };
    }
    
    const visits = await Visit.findAll({
      where,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['visitDate', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visits/:id
// @desc    Get visit by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'cnp']
        }
      ]
    });
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/visits
// @desc    Create new visit
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      recordedById: req.user.id
    };
    
    const visit = await Visit.create(visitData);
    
    // Update patient's lastVisit
    await Patient.update(
      { lastVisit: visit.visitDate },
      { where: { id: visit.patientId } }
    );
    
    const populatedVisit = await Visit.findByPk(visit.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    
    res.status(201).json(populatedVisit);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/visits/:id
// @desc    Update visit
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    await visit.update(req.body);
    await visit.reload({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    
    res.json(visit);
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/visits/:id
// @desc    Delete visit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const visit = await Visit.findByPk(req.params.id);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    await visit.destroy();
    res.json({ message: 'Visit deleted' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visits/patient/:patientId/stats
// @desc    Get visit statistics for a patient
// @access  Private
router.get('/patient/:patientId/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = { patientId: req.params.patientId };
    
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate[Op.gte] = startDate;
      if (endDate) where.visitDate[Op.lte] = endDate;
    }
    
    const visits = await Visit.findAll({
      where,
      order: [['visitDate', 'ASC']]
    });
    
    if (visits.length === 0) {
      return res.json({
        totalVisits: 0,
        avgAhi: null,
        avgCompliance: null,
        firstVisit: null,
        lastVisit: null,
        trend: null
      });
    }
    
    // Calculate statistics
    const ahiValues = visits.filter(v => v.ahi !== null).map(v => parseFloat(v.ahi));
    const complianceValues = visits.filter(v => v.cpapCompliancePct !== null).map(v => parseInt(v.cpapCompliancePct));
    
    const avgAhi = ahiValues.length > 0 
      ? (ahiValues.reduce((sum, val) => sum + val, 0) / ahiValues.length).toFixed(2)
      : null;
      
    const avgCompliance = complianceValues.length > 0
      ? Math.round(complianceValues.reduce((sum, val) => sum + val, 0) / complianceValues.length)
      : null;
    
    // Determine trend
    let trend = 'stable';
    if (ahiValues.length >= 2) {
      const firstAhi = ahiValues[0];
      const lastAhi = ahiValues[ahiValues.length - 1];
      const improvement = ((firstAhi - lastAhi) / firstAhi) * 100;
      
      if (improvement > 10) trend = 'improving';
      else if (improvement < -10) trend = 'worsening';
    }
    
    res.json({
      totalVisits: visits.length,
      avgAhi,
      avgCompliance,
      firstVisit: visits[0].visitDate,
      lastVisit: visits[visits.length - 1].visitDate,
      trend,
      visits: visits.map(v => ({
        date: v.visitDate,
        ahi: v.ahi,
        compliance: v.cpapCompliancePct
      }))
    });
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
