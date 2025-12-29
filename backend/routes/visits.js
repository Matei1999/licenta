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
  // Support both legacy flat AHI and new nested polysomnography.ahi
  const visitAhi = (visit.polysomnography && visit.polysomnography.ahi != null)
    ? parseFloat(visit.polysomnography.ahi)
    : (visit.ahi != null ? parseFloat(visit.ahi) : null);
  console.log('Visit AHI:', visitAhi);
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
  if (visitAhi !== null && visitAhi !== undefined && !Number.isNaN(visitAhi)) {
    if (visitAhi < 5) {
      updateData.osaClassification = 'Normal';
    } else if (visitAhi < 15) {
      updateData.osaClassification = 'Ușoară';
    } else if (visitAhi < 30) {
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

  // Update patient comorbidities: REPLACE with latest visit comorbidities (visit is source of truth)
  if (visit.comorbidities) {
    console.log('Visit comorbidities found:', JSON.stringify(visit.comorbidities, null, 2));
    // Replace patient comorbidities with visit comorbidities entirely
    const updatedComorbidities = {
      cardiovascular: Array.isArray(visit.comorbidities.cardiovascular) ? visit.comorbidities.cardiovascular : [],
      metabolic: Array.isArray(visit.comorbidities.metabolic) ? visit.comorbidities.metabolic : [],
      respiratory: Array.isArray(visit.comorbidities.respiratory) ? visit.comorbidities.respiratory : [],
      neurologic: Array.isArray(visit.comorbidities.neurologic) ? visit.comorbidities.neurologic : [],
      other: Array.isArray(visit.comorbidities.other) ? visit.comorbidities.other : []
    };
    
    if (visit.comorbidities.otherText) {
      updatedComorbidities.otherText = visit.comorbidities.otherText;
    }
    
    console.log('Replacing patient comorbidities with visit comorbidities:', JSON.stringify(updatedComorbidities, null, 2));
    updateData.comorbidities = updatedComorbidities;
  } else {
    console.log('No comorbidities in visit');
  }

  // Update patient behavioral data from visit: REPLACE (visit is source of truth)
  if (visit.behavioral) {
    console.log('Visit behavioral data found:', JSON.stringify(visit.behavioral, null, 2));
    const updatedBehavioral = patient.behavioral || {};
    
    if (visit.behavioral.sleepHoursPerNight !== undefined) updatedBehavioral.avgSleepDuration = visit.behavioral.sleepHoursPerNight;
    if (visit.behavioral.bedtimeTypical !== undefined) updatedBehavioral.bedtimeTypical = visit.behavioral.bedtimeTypical;
    if (visit.behavioral.wakeTimeTypical !== undefined) updatedBehavioral.waketimeTypical = visit.behavioral.wakeTimeTypical;
    if (visit.behavioral.sleepVariability !== undefined) updatedBehavioral.sleepVariability = visit.behavioral.sleepVariability;
    if (visit.behavioral.fragmentedSleep !== undefined) updatedBehavioral.fragmentedSleep = visit.behavioral.fragmentedSleep;
    if (visit.behavioral.hasNaps !== undefined) updatedBehavioral.hasNaps = visit.behavioral.hasNaps;
    if (visit.behavioral.napFrequency !== undefined) updatedBehavioral.napFrequency = visit.behavioral.napFrequency;
    if (visit.behavioral.napDuration !== undefined) updatedBehavioral.napDurationMin = visit.behavioral.napDuration;
    if (visit.behavioral.smokingStatus !== undefined) updatedBehavioral.smokingStatus = visit.behavioral.smokingStatus;
    if (visit.behavioral.cigarettesPerDay !== undefined) updatedBehavioral.cigarettesPerDay = visit.behavioral.cigarettesPerDay;
    if (visit.behavioral.packsPerDay !== undefined) updatedBehavioral.packsPerDay = visit.behavioral.packsPerDay;
    if (visit.behavioral.smokingYears !== undefined) updatedBehavioral.smokingYears = visit.behavioral.smokingYears;
    if (visit.behavioral.alcoholFrequency !== undefined) updatedBehavioral.alcoholFrequency = visit.behavioral.alcoholFrequency;
    if (visit.behavioral.alcoholAmount !== undefined) updatedBehavioral.alcoholQuantity = visit.behavioral.alcoholAmount;
    if (visit.behavioral.caffeineCount !== undefined) updatedBehavioral.caffeineIntake = visit.behavioral.caffeineCount;
    if (visit.behavioral.physicalActivity !== undefined) updatedBehavioral.physicalActivityLevel = visit.behavioral.physicalActivity;
    if (visit.behavioral.physicalActivityHours !== undefined) updatedBehavioral.physicalActivityHours = visit.behavioral.physicalActivityHours;
    if (visit.behavioral.sleepPosition !== undefined) updatedBehavioral.sleepPositionPrimary = visit.behavioral.sleepPosition;
    if (visit.behavioral.positionalOSA !== undefined) updatedBehavioral.positionalOSA = visit.behavioral.positionalOSA;
    
    console.log('Replacing patient behavioral with visit behavioral:', JSON.stringify(updatedBehavioral, null, 2));
    updateData.behavioral = updatedBehavioral;
  } else {
    console.log('No behavioral data in visit');
  }

  // Update patient ORL data from visit: REPLACE (visit is source of truth)
  if (visit.orlHistory) {
    console.log('Visit ORL history found:', JSON.stringify(visit.orlHistory, null, 2));
    const updatedBehavioral = updateData.behavioral || patient.behavioral || {};
    
    if (visit.orlHistory.septumDeviation !== undefined) {
      updatedBehavioral.septumDeviation = visit.orlHistory.septumDeviation;
    } else if (visit.orlHistory.deviateSeptum !== undefined) {
      updatedBehavioral.septumDeviation = visit.orlHistory.deviateSeptum === 'da' || visit.orlHistory.deviateSeptum === true;
    }
    if (visit.orlHistory.tonsilHypertrophy !== undefined) updatedBehavioral.tonsillarHypertrophy = visit.orlHistory.tonsilHypertrophy;
    if (visit.orlHistory.macroglossia !== undefined) updatedBehavioral.macroglossia = visit.orlHistory.macroglossia;
    if (visit.orlHistory.mallampatiClass !== undefined) updatedBehavioral.mallampati = visit.orlHistory.mallampatiClass;
    if (visit.orlHistory.retrognathia !== undefined) updatedBehavioral.retrognathia = visit.orlHistory.retrognathia;
    if (visit.orlHistory.nasalObstruction !== undefined) updatedBehavioral.nasalObstruction = visit.orlHistory.nasalObstruction;
    if (visit.orlHistory.chronicRhinitis !== undefined) updatedBehavioral.chronicRhinitis = visit.orlHistory.chronicRhinitis;
    if (visit.orlHistory.orlSurgery !== undefined) updatedBehavioral.priorENTSurgery = visit.orlHistory.orlSurgeryDetails || null;
    
    console.log('Replacing patient ORL data with visit ORL:', JSON.stringify(updatedBehavioral, null, 2));
    updateData.behavioral = updatedBehavioral;
  } else {
    console.log('No ORL data in visit');
  }

  // Update patient psychosocial data from visit: REPLACE (visit is source of truth)
  if (visit.psychosocial) {
    console.log('Visit psychosocial data found:', JSON.stringify(visit.psychosocial, null, 2));
    const updatedPsychosocial = {};
    if (visit.psychosocial.saqliDailyEnergy !== undefined) updatedPsychosocial.saqliDailyEnergy = visit.psychosocial.saqliDailyEnergy;
    if (visit.psychosocial.saqliDailyConcentration !== undefined) updatedPsychosocial.saqliDailyConcentration = visit.psychosocial.saqliDailyConcentration;
    if (visit.psychosocial.saqliDailyProductivity !== undefined) updatedPsychosocial.saqliDailyProductivity = visit.psychosocial.saqliDailyProductivity;
    if (visit.psychosocial.saqliSocialIntimate !== undefined) updatedPsychosocial.saqliSocialIntimate = visit.psychosocial.saqliSocialIntimate;
    if (visit.psychosocial.saqliSocialActivities !== undefined) updatedPsychosocial.saqliSocialActivities = visit.psychosocial.saqliSocialActivities;
    if (visit.psychosocial.saqliSocialSelfEsteem !== undefined) updatedPsychosocial.saqliSocialSelfEsteem = visit.psychosocial.saqliSocialSelfEsteem;
    if (visit.psychosocial.saqliEmotionalMood !== undefined) updatedPsychosocial.saqliEmotionalMood = visit.psychosocial.saqliEmotionalMood;
    if (visit.psychosocial.saqliEmotionalAnxiety !== undefined) updatedPsychosocial.saqliEmotionalAnxiety = visit.psychosocial.saqliEmotionalAnxiety;
    if (visit.psychosocial.saqliEmotionalFrustration !== undefined) updatedPsychosocial.saqliEmotionalFrustration = visit.psychosocial.saqliEmotionalFrustration;
    if (visit.psychosocial.saqliSymptomsSleepiness !== undefined) updatedPsychosocial.saqliSymptomsSleepiness = visit.psychosocial.saqliSymptomsSleepiness;
    if (visit.psychosocial.saqliSymptomsFatigue !== undefined) updatedPsychosocial.saqliSymptomsFatigue = visit.psychosocial.saqliSymptomsFatigue;
    if (visit.psychosocial.saqliSymptomsSnoring !== undefined) updatedPsychosocial.saqliSymptomsSnoring = visit.psychosocial.saqliSymptomsSnoring;
    if (visit.psychosocial.saqliSymptomsAwakenings !== undefined) updatedPsychosocial.saqliSymptomsAwakenings = visit.psychosocial.saqliSymptomsAwakenings;
    if (visit.psychosocial.saqliTreatmentSatisfaction !== undefined) updatedPsychosocial.saqliTreatmentSatisfaction = visit.psychosocial.saqliTreatmentSatisfaction;
    if (visit.psychosocial.saqliTreatmentSideEffects !== undefined) updatedPsychosocial.saqliTreatmentSideEffects = visit.psychosocial.saqliTreatmentSideEffects;
    if (visit.psychosocial.saqliTreatmentDiscomfort !== undefined) updatedPsychosocial.saqliTreatmentDiscomfort = visit.psychosocial.saqliTreatmentDiscomfort;
    console.log('Replacing patient psychosocial with visit data:', JSON.stringify(updatedPsychosocial, null, 2));
    updateData.psychosocial = updatedPsychosocial;
  } else {
    console.log('No psychosocial data in visit');
  }

  // Update patient biomarkers from visit: REPLACE (visit is source of truth)
  if (visit.biomarkers) {
    console.log('Visit biomarkers data found:', JSON.stringify(visit.biomarkers, null, 2));
    const updatedBiomarkers = {};
    if (visit.biomarkers.crp !== undefined) updatedBiomarkers.crp = visit.biomarkers.crp;
    if (visit.biomarkers.hba1c !== undefined) updatedBiomarkers.hba1c = visit.biomarkers.hba1c;
    if (visit.biomarkers.ldl !== undefined) updatedBiomarkers.ldl = visit.biomarkers.ldl;
    if (visit.biomarkers.hdl !== undefined) updatedBiomarkers.hdl = visit.biomarkers.hdl;
    if (visit.biomarkers.triglycerides !== undefined) updatedBiomarkers.triglycerides = visit.biomarkers.triglycerides;
    if (visit.biomarkers.tsh !== undefined) updatedBiomarkers.tsh = visit.biomarkers.tsh;
    if (visit.biomarkers.vitaminD !== undefined) updatedBiomarkers.vitaminD = visit.biomarkers.vitaminD;
    if (visit.biomarkers.creatinine !== undefined) updatedBiomarkers.creatinine = visit.biomarkers.creatinine;
    console.log('Replacing patient biomarkers with visit data:', JSON.stringify(updatedBiomarkers, null, 2));
    updateData.biomarkers = updatedBiomarkers;
  } else {
    console.log('No biomarkers data in visit');
  }
  
  // Update patient CPAP data from visit: REPLACE (visit is source of truth)
  if (visit.cpapData) {
    console.log('Visit cpapData found:', JSON.stringify(visit.cpapData, null, 2));
    const updatedCpapData = {};
    if (visit.cpapData.brand !== undefined) updatedCpapData.brand = visit.cpapData.brand;
    if (visit.cpapData.model !== undefined) updatedCpapData.model = visit.cpapData.model;
    if (visit.cpapData.therapyType !== undefined) updatedCpapData.therapyType = visit.cpapData.therapyType;
    if (visit.cpapData.pressureMin !== undefined) updatedCpapData.pressureMin = visit.cpapData.pressureMin;
    if (visit.cpapData.pressureMax !== undefined) updatedCpapData.pressureMax = visit.cpapData.pressureMax;
    if (visit.cpapData.startDate !== undefined) updatedCpapData.startDate = visit.cpapData.startDate;
    if (visit.cpapData.maskType !== undefined) updatedCpapData.maskType = visit.cpapData.maskType;
    if (visit.cpapData.humidificationEnabled !== undefined) updatedCpapData.humidificationEnabled = visit.cpapData.humidificationEnabled;
    if (visit.cpapData.humidificationLevel !== undefined) updatedCpapData.humidificationLevel = visit.cpapData.humidificationLevel;
    if (visit.cpapData.rampEnabled !== undefined) updatedCpapData.rampEnabled = visit.cpapData.rampEnabled;
    if (visit.cpapData.rampTime !== undefined) updatedCpapData.rampTime = visit.cpapData.rampTime;
    
    if (visit.cpapData.technicalProblems) {
      updatedCpapData.technicalProblems = {};
      if (visit.cpapData.technicalProblems.facialIrritation !== undefined) updatedCpapData.technicalProblems.facialIrritation = visit.cpapData.technicalProblems.facialIrritation;
      if (visit.cpapData.technicalProblems.claustrophobia !== undefined) updatedCpapData.technicalProblems.claustrophobia = visit.cpapData.technicalProblems.claustrophobia;
      if (visit.cpapData.technicalProblems.deviceNoise !== undefined) updatedCpapData.technicalProblems.deviceNoise = visit.cpapData.technicalProblems.deviceNoise;
      if (visit.cpapData.technicalProblems.nasalSecretions !== undefined) updatedCpapData.technicalProblems.nasalSecretions = visit.cpapData.technicalProblems.nasalSecretions;
      if (visit.cpapData.technicalProblems.aerophagia !== undefined) updatedCpapData.technicalProblems.aerophagia = visit.cpapData.technicalProblems.aerophagia;
      if (visit.cpapData.technicalProblems.otherIssues !== undefined) updatedCpapData.technicalProblems.otherIssues = visit.cpapData.technicalProblems.otherIssues;
    }
    
    if (visit.cpapData.nonAdherenceReasons) {
      updatedCpapData.nonAdherenceReasons = {};
      if (visit.cpapData.nonAdherenceReasons.dryness !== undefined) updatedCpapData.nonAdherenceReasons.dryness = visit.cpapData.nonAdherenceReasons.dryness;
      if (visit.cpapData.nonAdherenceReasons.pressureTooHigh !== undefined) updatedCpapData.nonAdherenceReasons.pressureTooHigh = visit.cpapData.nonAdherenceReasons.pressureTooHigh;
      if (visit.cpapData.nonAdherenceReasons.anxiety !== undefined) updatedCpapData.nonAdherenceReasons.anxiety = visit.cpapData.nonAdherenceReasons.anxiety;
      if (visit.cpapData.nonAdherenceReasons.other !== undefined) updatedCpapData.nonAdherenceReasons.other = visit.cpapData.nonAdherenceReasons.other;
    }
    
    console.log('Replacing patient cpapData with visit data:', JSON.stringify(updatedCpapData, null, 2));
    updateData.cpapData = updatedCpapData;
  } else {
    console.log('No cpapData in visit');
  }
  
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
