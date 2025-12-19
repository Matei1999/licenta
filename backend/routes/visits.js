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
// Helper function to update patient data based on latest visit
const updatePatientFromVisit = async (visit) => {
  console.log('=== Updating patient from visit ===');
  console.log('Visit ID:', visit.id);
  console.log('Patient ID:', visit.patientId);
  console.log('Visit AHI:', visit.ahi);
  console.log('Visit CPAP compliance:', visit.cpapCompliancePct);
  
  const patient = await Patient.findByPk(visit.patientId);
  if (!patient) {
    console.log('Patient not found!');
    return;
  }

  console.log('Patient found:', patient.firstName, patient.lastName);
  console.log('Current patient cpapData:', JSON.stringify(patient.cpapData, null, 2));

  const updateData = {
    lastVisit: visit.visitDate
  };

  // Update OSA classification based on AHI
  if (visit.ahi !== null && visit.ahi !== undefined) {
    if (visit.ahi < 5) {
      updateData.osaClassification = 'Normal';
    } else if (visit.ahi < 15) {
      updateData.osaClassification = 'Ușoară';
    } else if (visit.ahi < 30) {
      updateData.osaClassification = 'Moderată';
    } else {
      updateData.osaClassification = 'Severă';
    }
    console.log('Calculated OSA classification:', updateData.osaClassification);
  }

  // Update CPAP data from visit
  const cpapData = patient.cpapData || {};
  
  if (visit.cpapCompliancePct !== null) {
    cpapData.compliance = visit.cpapCompliancePct;
  }
  if (visit.cpapCompliance4hPct !== null) {
    cpapData.compliance4h = visit.cpapCompliance4hPct;
  }
  if (visit.cpapUsageMin !== null) {
    cpapData.averageUsage = visit.cpapUsageMin;
  }
  if (visit.cpapLeaks95p !== null) {
    cpapData.leaks95p = visit.cpapLeaks95p;
  }
  if (visit.cpapPressure95p !== null) {
    cpapData.pressure95p = visit.cpapPressure95p;
  }
  if (visit.maskType) {
    cpapData.maskType = visit.maskType;
  }

  updateData.cpapData = cpapData;
  
  console.log('Update data to save:', JSON.stringify(updateData, null, 2));

  await patient.update(updateData);
  
  console.log('Patient updated successfully');
  console.log('=== End update ===');
};

router.post('/', auth, async (req, res) => {
  try {
    const visitData = {
      ...req.body,
      recordedById: req.user.id
    };
    
    const visit = await Visit.create(visitData);
    
    // Update patient data based on this visit
    await updatePatientFromVisit(visit);
    
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
    
    // Check if this is the most recent visit for this patient
    const latestVisit = await Visit.findOne({
      where: { patientId: visit.patientId },
      order: [['visitDate', 'DESC']]
    });
    
    // If this is the latest visit, update patient data
    if (latestVisit && latestVisit.id === visit.id) {
      await updatePatientFromVisit(visit);
    }
    
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
