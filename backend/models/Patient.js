
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encryptCNP, decryptCNP } = require('../utils/cnpCrypto');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Date Identificare
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cnp: {
    type: DataTypes.STRING(255), // encrypted CNP
    allowNull: true,
    set(val) {
      if (!val) {
        this.setDataValue('cnp', null);
        this.setDataValue('cnp_hash', null);
      } else {
        this.setDataValue('cnp', encryptCNP(val));
        // Setează hash-ul pentru căutare
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(val).digest('hex');
        this.setDataValue('cnp_hash', hash);
      }
    }
  },

  // Hash pentru căutare rapidă și sigură după CNP
  cnp_hash: {
    type: DataTypes.STRING(64),
    allowNull: true
  },

  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false
  },
  decedat: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Contact
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Biometrie
  heightCm: {
    type: DataTypes.INTEGER
  },
  weightKg: {
    type: DataTypes.DECIMAL(5, 2)
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 2)
  },
  neckCircumferenceCm: {
    type: DataTypes.INTEGER
  },
  
  // Locație
  county: {
    type: DataTypes.STRING
  },
  locality: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // Demografie Extinsă
  maritalStatus: {
    type: DataTypes.ENUM('Necăsătorit/ă', 'Căsătorit/ă', 'Divorțat/ă', 'Văduv/ă')
  },
  occupation: {
    type: DataTypes.STRING
  },
  educationLevel: {
    type: DataTypes.ENUM('Primar', 'Gimnazial', 'Liceal', 'Universitar', 'Postuniversitar')
  },
  environmentType: {
    type: DataTypes.ENUM('Urban', 'Rural', 'Suburban')
  },
  householdSize: {
    type: DataTypes.INTEGER
  },
  childrenCount: {
    type: DataTypes.INTEGER
  },
  
  medicalHistory: {
    type: DataTypes.JSONB,
    defaultValue: {
      conditions: [],
      medications: [],
      allergies: []
    }
  },
  sleepApneaDetails: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  
  // Screening OSA
  stopBangScore: {
    type: DataTypes.INTEGER
  },
  epworthScore: {
    type: DataTypes.INTEGER
  },
  sleepPosition: {
    type: DataTypes.ENUM('Spate', 'Lateral', 'Abdomen', 'Mixtă')
  },
  sasoForm: {
    type: DataTypes.ENUM('Ușoară', 'Moderată', 'Severă'),
    allowNull: true
  },
  
  // Comorbidități extinse (JSONB)
  comorbidities: {
    type: DataTypes.JSONB,
    defaultValue: {
      cardiovascular: [],
      metabolic: [],
      respiratory: [],
      neurologic: [],
      other: []
    }
  },
  
  // Comportament & ORL (JSONB)
  behavioral: {
    type: DataTypes.JSONB,
    defaultValue: {
      // 6.1 Somn
      avgSleepDuration: null,
      bedtimeTypical: null,
      waketimeTypical: null,
      sleepVariability: null, // 'Constantă' | 'Moderată' | 'Mare'
      fragmentedSleep: false, // treziri >3/noapte
      hasNaps: false,
      napFrequency: null, // 'Zilnic' | 'Ocazional' | 'Rar'
      napDurationMin: null,
      // 6.2 Stil de viață
      smokingStatus: null, // 'Nefumător' | 'Fumător activ' | 'Fumător pasiv' | 'Fost fumător'
      cigarettesPerDay: null,
      packsPerDay: null,
      smokingYears: null,
      alcoholFrequency: null, // 'Zilnic' | 'Săptămânal' | 'Ocazional' | 'Niciodată'
      alcoholQuantity: null,
      caffeineIntake: null, // nr cafele/zi
      physicalActivityLevel: null, // 'Sedentar' | 'Moderat' | 'Intens'
      physicalActivityHours: null,
      // 6.3 Poziție somn
      sleepPositionPrimary: null, // 'Dorsal' | 'Lateral' | 'Mixt'
      positionalOSA: null,
      // ORL
      mallampati: null,
      septumDeviation: false,
      macroglossia: false,
      tonsillarHypertrophy: false,
      retrognathia: false,
      nasalObstruction: false,
      chronicRhinitis: false,
      priorENTSurgery: null,
      // Risc rutier (categoria 10 - critică legal)
      isProfessionalDriver: false,
      drowsyDriving: false,
      drowsinessFrequency: null, // 'Rar' | 'Ocazional' | 'Frecvent' | 'Zilnic'
      roadAccidents: null,
      shiftWorkHours: null,
      drivingResumedAfterTreatment: null // null | true | false
    }
  },
  
  // Date Psihosociale (JSONB)
  psychosocial: {
    type: DataTypes.JSONB,
    defaultValue: {
      saqliDailyEnergy: null,
      saqliDailyConcentration: null,
      saqliDailyProductivity: null,
      saqliSocialIntimate: null,
      saqliSocialActivities: null,
      saqliSocialSelfEsteem: null,
      saqliEmotionalMood: null,
      saqliEmotionalAnxiety: null,
      saqliEmotionalFrustration: null,
      saqliSymptomsSleepiness: null,
      saqliSymptomsFatigue: null,
      saqliSymptomsSnoring: null,
      saqliSymptomsAwakenings: null,
      saqliTreatmentSatisfaction: null,
      saqliTreatmentSideEffects: null,
      saqliTreatmentDiscomfort: null
    }
  },
  
  // Biomarkeri (JSONB)
  biomarkers: {
    type: DataTypes.JSONB,
    defaultValue: {
      crp: null,
      hba1c: null,
      ldl: null,
      hdl: null,
      triglycerides: null,
      tsh: null,
      vitaminD: null,
      creatinine: null
    }
  },
  
  // Medicație (JSONB)
  medications: {
    type: DataTypes.JSONB,
    defaultValue: {
      benzodiazepines: null,
      opioids: null,
      sedativeAntidepressants: null,
      antihypertensives: null,
      corticosteroids: null,
      antihistamines: null,
      hypnotics: null
    }
  },
  
  // Istoric Familial (JSONB)
  familyHistory: {
    type: DataTypes.JSONB,
    defaultValue: {
      osaRelatives: false,
      cardiomyopathy: false,
      diabetes: false,
      snoring: false
    }
  },
  
  // Date CPAP (JSONB)
  cpapData: {
    type: DataTypes.JSONB,
    defaultValue: {
      brand: null,
      model: null,
      therapyType: null, // CPAP / APAP / BiPAP / ASV
      pressureMin: null,
      pressureMax: null,
      startDate: null,
      maskType: null,
      // 9.2 Probleme tehnice
      technicalProblems: {
        facialIrritation: false,
        claustrophobia: false,
        deviceNoise: false,
        nasalSecretions: false,
        aerophagia: false,
        otherIssues: null
      },
      // Motive neaderență
      nonAdherenceReasons: {
        dryness: false,
        pressureTooHigh: false,
        anxiety: false,
        other: null
      },
      // 9.3 Umidificare
      humidificationEnabled: false,
      humidificationLevel: null,
      // Setări rampă
      rampEnabled: false,
      rampTime: null
    }
  },
  
  // Imagine profil
  img: {
    type: DataTypes.STRING
  },
  
  // Consimțăminte GDPR
  consentMedicalData: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consentDataStorage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  consentClinicalStudies: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Ultima vizită (pentru afișare rapidă)
  lastVisit: {
    type: DataTypes.DATEONLY
  },
  
  assignedDoctorId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Discharged'),
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT
  },

  // Polysomnografia (JSONB)
  polysomnography: {
    type: DataTypes.JSONB,
    defaultValue: {
      ahi: null,
      ahiNrem: null,
      ahiRem: null,
      ahiResidual: null,
      desatIndex: null,
      spo2Min: null,
      spo2Max: null,
      spo2Mean: null,
      t90: null,
      t45: null,
      hypoxicBurden: null
    },
    allowNull: true
  },

  // Screening (JSONB)
  screening: {
    type: DataTypes.JSONB,
    defaultValue: {
      sasoForm: null,
      stopBangScore: null,
      epworthScore: null
    },
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (patient) => {
      // Auto-calculare BMI
      if (patient.heightCm && patient.weightKg) {
        const heightM = patient.heightCm / 100;
        patient.bmi = (patient.weightKg / (heightM * heightM)).toFixed(2);
      }
      // Forțează popularea cnp_hash dacă există CNP (decriptat)
      const { decryptCNP } = require('../utils/cnpCrypto');
      const crypto = require('crypto');
      const rawCnp = patient.getDataValue('cnp');
      console.log('--- beforeSave hook ---');
      console.log('rawCnp:', rawCnp);
      if (rawCnp) {
        let cnpPlain = null;
        try {
          cnpPlain = decryptCNP(rawCnp);
        } catch (e) {
          console.log('Eroare la decriptare CNP:', e);
          cnpPlain = null;
        }
        console.log('cnpPlain:', cnpPlain);
        if (cnpPlain && cnpPlain.length === 13) {
          const hash = crypto.createHash('sha256').update(cnpPlain).digest('hex');
          patient.setDataValue('cnp_hash', hash);
          console.log('Setat cnp_hash:', hash);
        } else {
          patient.setDataValue('cnp_hash', null);
          console.log('CNP invalid, setat cnp_hash null');
        }
      } else {
        patient.setDataValue('cnp_hash', null);
        console.log('Nu există CNP, setat cnp_hash null');
      }
    }
  }
});

module.exports = Patient;
