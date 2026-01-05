require('dotenv').config();
const db = require('./models');
const { Op } = require('sequelize');

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

// Realistic Romanian data
const COMORBIDITIES = {
  cardiovascular: ['Hipertensiune arterială', 'Cardiopatie ischemică', 'Fibrilație atrială', 'Insuficiență cardiacă', 'Accident vascular cerebral'],
  metabolic: ['Diabet zaharat tip 2', 'Obezitate', 'Dislipidemie', 'Rezistență la insulină', 'Sindrom metabolic'],
  respiratory: ['BPOC', 'Astm bronșic', 'Rinită alergică', 'Sinuzită cronică', 'Apnee centrală'],
  neurologic: ['Migrenă', 'Epilepsie', 'Parkinson', 'Depresie', 'Anxietate'],
  other: ['Gastrita', 'GERD', 'Artrita', 'Osteoporoza', 'Probleme tiroidiene']
};

const MEDICATIONS = [
  'Ramipril', 'Enalapril', 'Losartan', 'Valsartan',
  'Amlodipină', 'Diltiazem', 'Verapamil',
  'Atorvastatină', 'Simvastatină', 'Rosuvastatină',
  'Metformin', 'Glibenclamidă', 'Pioglitazonă',
  'Aspirină', 'Clopidogrel', 'Warfarină',
  'Levotirozină', 'Propranolol', 'Metoprolol',
  'Sertraline', 'Citalopram', 'Paroxetina',
  'Pantoprazol', 'Omeprazol', 'Lansoprazol'
];

const BEHAVIORAL = {
  sleepDuration: ['5-6 ore', '6-7 ore', '7-8 ore', '8-9 ore'],
  bedtime: ['22:00', '22:30', '23:00', '23:30', '00:00'],
  waketime: ['06:00', '06:30', '07:00', '07:30', '08:00'],
  sleepVariability: ['Redusă', 'Moderată', 'Ridicată'],
  smokingStatus: ['Niciodată', 'Foștii fumători', 'Fumatori activi'],
  alcoholFrequency: ['Niciodată', 'Ocazional', 'Săptămânal', 'Zilnic'],
  caffeineIntake: ['Scăzut', 'Moderat', 'Ridicat'],
  physicalActivityLevel: ['Sedentar', 'Ușor activ', 'Moderat activ', 'Foarte activ']
};

// Update patients with complete data
async function populateCompleteData() {
  try {
    console.log('🔄 Populating 2000 patients with complete data...\n');
    
    const patients = await db.Patient.findAll({ 
      limit: 2000,
      include: [{ model: db.Visit, as: 'visits' }]
    });

    console.log(`Found ${patients.length} patients to update`);
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      // Pre-generate screening & polysomnography so patient-level fields are populated (UI detail tab uses these)
      const screeningData = {
        sasoForm: randomChoice(['normală', 'moderată', 'severă']),
        stopBangScore: randomInt(2, 8),
        epworthScore: randomInt(0, 24)
      };

      const polysomnographyData = {
        ahi: randomFloat(3, 85, 1),
        ahiNrem: randomFloat(2, 70, 1),
        ahiRem: randomFloat(3, 90, 1),
        ahiResidual: randomFloat(0, 10, 1),
        desatIndex: randomFloat(1, 90, 1),
        spo2Min: randomFloat(75, 95, 1),
        spo2Max: randomFloat(95, 100, 1),
        spo2Mean: randomFloat(92, 97, 1),
        t90: randomFloat(0, 30, 1),
        t45: randomFloat(0, 15, 1),
        hypoxicBurden: randomFloat(0, 120, 1)
      };
      
      // Update patient with complete data
      const updateData = {
        // Medical history
        medicalHistory: {
          conditions: patient.comorbidities?.length > 0 
            ? patient.comorbidities 
            : Array.from({ length: randomInt(0, 3) }, () => ({
                category: randomChoice(['cardiovascular', 'metabolic', 'respiratory', 'neurologic', 'other']),
                condition: randomChoice(COMORBIDITIES.cardiovascular.concat(COMORBIDITIES.metabolic, COMORBIDITIES.respiratory, COMORBIDITIES.neurologic, COMORBIDITIES.other)),
                diagnosisYear: randomInt(1990, 2024),
                status: 'Active'
              })),
          medications: Array.from({ length: randomInt(1, 5) }, () => ({
            name: randomChoice(MEDICATIONS),
            dosage: `${randomInt(5, 500)} mg`,
            frequency: randomChoice(['o dată zilnic', 'de două ori pe zi', 'de trei ori pe zi']),
            startDate: `${randomInt(2015, 2024)}-${String(randomInt(1, 12)).padStart(2, '0')}-01`,
            notes: randomBool(0.3) ? 'Bine tolerată' : null
          })),
          allergies: randomBool(0.2) ? [{ allergen: 'Penicilină', reaction: 'Rash' }] : []
        },
        
        // Sleep apnea details
        sleepApneaDetails: {
          initialSymptoms: randomBool(0.8) ? ['Roncă', 'Somnolență diurnă', 'Apnee observate'] : [],
          symptomOnsetYear: randomInt(2010, 2024),
          familyHistory: randomBool(0.3),
          previousTreatment: randomBool(0.4) ? 'CPAP' : null
        },
        
        // Behavioral data
        behavioral: {
          avgSleepDuration: randomChoice(['5-6 ore', '6-7 ore', '7-8 ore', '8-9 ore']),
          bedtimeTypical: randomChoice(['22:00', '22:30', '23:00', '23:30', '00:00']),
          waketimeTypical: randomChoice(['06:00', '06:30', '07:00', '07:30', '08:00']),
          sleepVariability: randomChoice(['Redusă', 'Moderată', 'Ridicată']),
          fragmentedSleep: randomBool(0.6),
          hasNaps: randomBool(0.4),
          napFrequency: randomBool(0.4) ? randomInt(1, 5) : null,
          napDurationMin: randomBool(0.4) ? randomInt(15, 120) : null,
          smokingStatus: randomChoice(['Niciodată', 'Foștii fumători', 'Fumatori activi']),
          cigarettesPerDay: randomBool(0.2) ? randomInt(1, 40) : null,
          packsPerYear: randomBool(0.2) ? randomInt(1, 50) : null,
          alcoholFrequency: randomChoice(['Niciodată', 'Ocazional', 'Săptămânal', 'Zilnic']),
          alcoholQuantity: randomBool(0.3) ? `${randomInt(1, 10)} unități/săptămână` : null,
          caffeineIntake: randomChoice(['Scăzut (0-1 cană)', 'Moderat (1-3 căni)', 'Ridicat (>3 căni)']),
          physicalActivityLevel: randomChoice(['Sedentar', 'Ușor activ', 'Moderat activ', 'Foarte activ']),
          physicalActivityHours: randomInt(0, 10),
          sleepPositionPrimary: randomChoice(['Spate', 'Lateral', 'Abdomen']),
          positionalOSA: randomBool(0.3),
          mallampati: randomInt(1, 4),
          septumDeviation: randomBool(0.2),
          macroglossia: randomBool(0.15),
          tonsillarHypertrophy: randomBool(0.1),
          retrognathia: randomBool(0.1),
          nasalObstruction: randomBool(0.25),
          chronicRhinitis: randomBool(0.15),
          priorENTSurgery: randomBool(0.1) ? 'Septoplastie' : null,
          isProfessionalDriver: randomBool(0.2),
          drowsyDriving: randomBool(0.15),
          drowsinessFrequency: randomBool(0.15) ? randomInt(1, 10) : null,
          roadAccidents: randomBool(0.05) ? randomInt(0, 2) : null,
          shiftWorkHours: randomBool(0.1) ? randomInt(4, 12) : null,
          drivingResumedAfterTreatment: randomBool(0.7)
        },
        
        // Psychosocial data
        psychosocial: {
          saqliDailyEnergy: randomInt(0, 10),
          saqliDailyConcentration: randomInt(0, 10),
          saqliDailyProductivity: randomInt(0, 10),
          saqliSocialIntimate: randomInt(0, 10),
          saqliSocialActivities: randomInt(0, 10),
          saqliSocialSelfEsteem: randomInt(0, 10),
          saqliEmotionalMood: randomInt(0, 10),
          saqliEmotionalAnxiety: randomInt(0, 10),
          saqliEmotionalFrustration: randomInt(0, 10),
          saqliSymptomsSleepiness: randomInt(0, 10),
          saqliSymptomsFatigue: randomInt(0, 10),
          saqliSymptomsSnoring: randomInt(0, 10),
          saqliSymptomsAwakenings: randomInt(0, 10),
          saqliTreatmentSatisfaction: randomInt(0, 10),
          saqliTreatmentSideEffects: randomInt(0, 10),
          saqliTreatmentDiscomfort: randomInt(0, 10)
        },
        
        // Biomarkers
        biomarkers: {
          crp: randomBool(0.3) ? randomFloat(0.5, 10, 1) : null,
          hba1c: randomBool(0.4) ? randomFloat(4.5, 8.5, 1) : null,
          ldl: randomBool(0.5) ? randomFloat(70, 200, 1) : null,
          hdl: randomBool(0.5) ? randomFloat(30, 80, 1) : null,
          triglycerides: randomBool(0.5) ? randomFloat(50, 400, 1) : null,
          tsh: randomBool(0.2) ? randomFloat(0.5, 5, 2) : null,
          vitaminD: randomBool(0.3) ? randomFloat(10, 80, 1) : null,
          creatinine: randomBool(0.3) ? randomFloat(0.7, 1.2, 1) : null
        },
        
        // Family history
        familyHistory: {
          osaRelatives: randomBool(0.35),
          cardiomyopathy: randomBool(0.1),
          diabetes: randomBool(0.25),
          snoring: randomBool(0.3),
          suddenDeaths: randomBool(0.05)
        },
        
        // CPAP data (~70% of patients with moderate/severe OSA receive CPAP)
        cpapData: randomBool(0.7) ? {
          brand: randomChoice(['ResMed', 'Philips Respironics', 'Fisher & Paykel', 'Vyaire']),
          model: `Model ${randomInt(100, 999)}`,
          therapyType: randomChoice(['CPAP', 'Auto-CPAP', 'BiPAP']),
          pressureMin: randomFloat(6, 12, 1),
          pressureMax: randomFloat(12, 20, 1),
          startDate: `${randomInt(2018, 2024)}-${String(randomInt(1, 12)).padStart(2, '0')}-01`,
          maskType: randomChoice(['Nasal', 'Orală', 'Full-face', 'Nasal pillow']),
          // Patient-level compliance snapshot used by listings when visit data is missing
          compliance: randomInt(60, 95),
          technicalProblems: {
            facialIrritation: randomBool(0.2),
            claustrophobia: randomBool(0.1),
            deviceNoise: randomBool(0.15),
            nasalSecretions: randomBool(0.25),
            aerophagia: randomBool(0.1),
            otherIssues: randomBool(0.1) ? 'Dermatita contactului' : null
          },
          nonAdherenceReasons: {
            dryness: randomBool(0.15),
            pressureTooHigh: randomBool(0.1),
            anxiety: randomBool(0.1),
            other: randomBool(0.1) ? 'Confort redus' : null
          },
          humidificationEnabled: randomBool(0.7),
          humidificationLevel: randomBool(0.7) ? randomInt(40, 80) : null,
          rampEnabled: randomBool(0.6),
          rampTime: randomBool(0.6) ? randomInt(10, 45) : null
        } : {
          brand: null,
          model: null,
          therapyType: null,
          pressureMin: null,
          pressureMax: null,
          startDate: null,
          maskType: null,
          compliance: null,
          technicalProblems: {},
          nonAdherenceReasons: {},
          humidificationEnabled: false,
          humidificationLevel: null,
          rampEnabled: false,
          rampTime: null
        },
        
        // Consents
        consentMedicalData: randomBool(0.95),
        consentDataStorage: randomBool(0.95),
        consentClinicalStudies: randomBool(0.6),
        
        status: 'Active'
      };

      // Populate patient-level screening & polysomnography (used in "Polysomnografie & Screening - Metrici Detaliate")
      updateData.screening = screeningData;
      updateData.polysomnography = polysomnographyData;
      
      await patient.update(updateData);
      
      // Update all visits with complete polysomnography data
      if (patient.visits && patient.visits.length > 0) {
        // Check if patient has CPAP therapy
        const patientCPAPData = patient.dataValues.cpapData || {};
        const hasCPAPTherapy = patientCPAPData && patientCPAPData.therapyType;
        
        for (const visit of patient.visits) {
          const hasOSA = randomBool(0.75);
          const ahi = hasOSA
            ? Math.max(0, polysomnographyData.ahi + randomFloat(-10, 10, 1))
            : randomFloat(0, 4.9, 1);
          
          const visitData = {
            clinician: 'Dr. Demo OSA',
            clinicalNotes: `Pacient ${randomInt(35, 70)} ani, evaluare OSA - IAH ${ahi}, somnolență diurnă ${randomChoice(['ușoară', 'moderată', 'severă'])}, roncă prezentă`,
            
            // Individual columns
            ahi: Math.max(0, ahi),
            desatIndex: Math.max(0, ahi * randomFloat(0.6, 1.2, 1)),
            spo2Mean: randomFloat(92, 97, 1),
            t90: randomFloat(0, 30, 1),
            
            // Screening (align with patient-level)
            screening: {
              sasoForm: screeningData.sasoForm,
              stopBangScore: Math.max(0, screeningData.stopBangScore + randomInt(-1, 1)),
              epworthScore: Math.max(0, screeningData.epworthScore + randomInt(-3, 3))
            },

            // Polysomnography (align with patient-level)
            polysomnography: {
              ahi: Math.max(0, ahi),
              ahiNrem: Math.max(0, polysomnographyData.ahiNrem + randomFloat(-5, 5, 1)),
              ahiRem: Math.max(0, polysomnographyData.ahiRem + randomFloat(-5, 5, 1)),
              ahiResidual: Math.max(0, polysomnographyData.ahiResidual + randomFloat(-2, 2, 1)),
              desatIndex: Math.max(0, polysomnographyData.desatIndex + randomFloat(-5, 5, 1)),
              spo2Min: Math.max(60, Math.min(100, polysomnographyData.spo2Min + randomFloat(-3, 3, 1))),
              spo2Max: Math.max(70, Math.min(100, polysomnographyData.spo2Max + randomFloat(-2, 2, 1))),
              spo2Mean: Math.max(70, Math.min(100, polysomnographyData.spo2Mean + randomFloat(-2, 2, 1))),
              t90: Math.max(0, polysomnographyData.t90 + randomFloat(-3, 3, 1)),
              t45: Math.max(0, polysomnographyData.t45 + randomFloat(-2, 2, 1)),
              hypoxicBurden: Math.max(0, polysomnographyData.hypoxicBurden + randomFloat(-10, 10, 1))
            },
            
            // CPAP data (if applicable)
            cpapCompliancePct: hasCPAPTherapy ? randomInt(50, 100) : null,
            cpapCompliance4hPct: hasCPAPTherapy ? randomInt(40, 95) : null,
            cpapComplianceLessThan4hPct: hasCPAPTherapy ? randomInt(5, 50) : null,
            cpapComplianceLessThan4h: hasCPAPTherapy ? randomBool(0.3) : false,
            cpapUsageMin: hasCPAPTherapy ? randomInt(180, 480) : null,
            cpapLeaks95p: hasCPAPTherapy ? randomFloat(10, 50, 1) : null,
            cpapPressure95p: hasCPAPTherapy ? randomFloat(8, 16, 1) : null,
            maskType: hasCPAPTherapy ? randomChoice(['Nazală', 'Oronazală', 'Pillows (perne nazale)', 'Pernă Nazală', 'Facială completă']) : null,
            maskFitGood: hasCPAPTherapy ? randomBool(0.8) : false,
            maskChange: hasCPAPTherapy ? randomBool(0.3) : false,
            
            cpapData: hasCPAPTherapy ? {
              brand: randomChoice(['ResMed', 'Philips Respironics', 'Fisher & Paykel', 'Vyaire']),
              model: `Model ${randomInt(100, 999)}`,
              therapyType: randomChoice(['CPAP', 'Auto-CPAP', 'BiPAP']),
              pressureMin: randomFloat(6, 12, 1),
              pressureMax: randomFloat(12, 20, 1),
              startDate: `${randomInt(2018, 2024)}-${String(randomInt(1, 12)).padStart(2, '0')}-01`,
              maskType: randomChoice(['Nasal', 'Orală', 'Full-face', 'Nasal pillow']),
              technicalProblems: {
                facialIrritation: randomBool(0.2),
                claustrophobia: randomBool(0.1),
                deviceNoise: randomBool(0.15),
                nasalSecretions: randomBool(0.25),
                aerophagia: randomBool(0.1),
                otherIssues: randomBool(0.1) ? 'Dermatita contactului' : null
              },
              nonAdherenceReasons: {
                dryness: randomBool(0.15),
                pressureTooHigh: randomBool(0.1),
                anxiety: randomBool(0.1),
                other: randomBool(0.1) ? 'Confort redus' : null
              },
              humidificationEnabled: randomBool(0.7),
              humidificationLevel: randomBool(0.7) ? randomInt(40, 80) : null,
              rampEnabled: randomBool(0.6),
              rampTime: randomBool(0.6) ? randomInt(10, 45) : null
            } : {
              brand: null,
              model: null,
              therapyType: null,
              pressureMin: null,
              pressureMax: null,
              startDate: null,
              maskType: null,
              technicalProblems: {},
              nonAdherenceReasons: {},
              humidificationEnabled: false,
              humidificationLevel: null,
              rampEnabled: false,
              rampTime: null
            },
            
            // Comorbidities
            comorbidities: {
              otherText: Array.from({ length: randomInt(1, 3) }, () => randomChoice(COMORBIDITIES.cardiovascular.concat(COMORBIDITIES.metabolic))).join(', ')
            },
            
            // Behavioral
            behavioral: {
              packYears: randomBool(0.2) ? randomInt(1, 50) : null,
              sleepHours: randomInt(5, 9),
              exerciseMinutesPerWeek: randomInt(0, 300),
              fragmentedSleep: randomBool(0.4),
              hasNaps: randomBool(0.3),
              positionalOSA: randomBool(0.2)
            },
            
            // ORL History
            orlHistory: {
              septumDeviation: randomBool(0.25),
              tonsilHypertrophy: randomBool(0.15),
              macroglossia: randomBool(0.1),
              uvulaHypertrophy: randomBool(0.1),
              retrognathia: randomBool(0.15),
              orlSurgery: randomBool(0.1),
              nasalObstruction: randomBool(0.25),
              chronicRhinitis: randomBool(0.15)
            },
            
            // Driving Risk
            drivingRisk: {
              drowsinessWhileDriving: randomBool(0.2),
              resumedDrivingAfterTreatment: randomBool(0.7)
            },
            
            // Psychosocial
            psychosocial: {
              sleepQuality: randomInt(1, 10),
              daytimeSleepiness: randomInt(1, 10),
              moodScore: randomInt(1, 10)
            },
            
            // Biomarkers
            biomarkers: {
              glucose: randomBool(0.3) ? randomInt(80, 200) : null,
              hba1c: randomBool(0.4) ? randomFloat(4.5, 8.5, 1) : null,
              ldl: randomBool(0.5) ? randomInt(70, 200) : null,
              hdl: randomBool(0.5) ? randomInt(30, 80) : null
            },
            
            // Driving Risk
            drivingRisk: {
              epworth: randomInt(0, 24),
              sleepyDriving: randomBool(0.15)
            },
            
            notes: `Evaluare completă - ${randomChoice(['pacient educsat', 'aderență bună', 'monitorizare continuă'])}`
          };
          
          await visit.update(visitData);
        }
      }
      
      if ((i + 1) % 200 === 0) {
        console.log(`✓ Updated ${i + 1}/2000 patients...`);
      }
    }
    
    console.log('\n✅ All 2000 patients populated with complete medical data!');
    console.log('📊 Patients now have:');
    console.log('   • Complete medical history with conditions & medications');
    console.log('   • Detailed behavioral & lifestyle data');
    console.log('   • Psychosocial & quality of life metrics');
    console.log('   • Biomarkers & lab results');
    console.log('   • Complete CPAP data where applicable');
    console.log('   • Full polysomnography data for all visits');
    console.log('   • Clinical notes & treatment recommendations');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

populateCompleteData();
