const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  
  visitDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  
  clinician: {
    type: DataTypes.STRING
  },
  
  // Metrici Somn
  ahi: {
    type: DataTypes.DECIMAL(5, 2)
  },
  ahiResidual: {
    type: DataTypes.DECIMAL(5, 2)
  },
  desatIndex: {
    type: DataTypes.DECIMAL(5, 2)
  },
  ahiNrem: {
    type: DataTypes.DECIMAL(5, 2)
  },
  ahiRem: {
    type: DataTypes.DECIMAL(5, 2)
  },
  
  // Saturație Oxigen
  spo2Min: {
    type: DataTypes.INTEGER
  },
  spo2Max: {
    type: DataTypes.INTEGER
  },
  spo2Mean: {
    type: DataTypes.DECIMAL(4, 2)
  },
  meanDesaturations: {
    type: DataTypes.DECIMAL(4, 2)
  },
  t90: {
    type: DataTypes.DECIMAL(5, 2)
  },
  t45: {
    type: DataTypes.DECIMAL(5, 2)
  },
  povaraHipoxica: {
    type: DataTypes.DECIMAL(7, 2)
  },
  
  // Metrici CPAP
  cpapCompliancePct: {
    type: DataTypes.INTEGER
  },
  cpapCompliance4hPct: {
    type: DataTypes.INTEGER
  },
  cpapUsageMin: {
    type: DataTypes.INTEGER
  },
  cpapLeaks95p: {
    type: DataTypes.DECIMAL(5, 2)
  },
  cpapPressure95p: {
    type: DataTypes.DECIMAL(4, 2)
  },
  maskType: {
    type: DataTypes.ENUM('Nazală', 'Oronazală', 'Pillows (perne nazale)', 'Pernă Nazală', 'Facială completă')
  },
  maskFitGood: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maskChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Detailed CPAP Device Data
  cpapData: {
    type: DataTypes.JSONB,
    defaultValue: {
      brand: null,
      model: null,
      therapyType: null,
      pressureMin: null,
      pressureMax: null,
      startDate: null,
      maskType: null,
      humidificationEnabled: false,
      humidificationLevel: null,
      rampEnabled: false,
      rampTime: null,
      technicalProblems: {
        facialIrritation: false,
        claustrophobia: false,
        deviceNoise: false,
        nasalSecretions: false,
        aerophagia: false,
        otherIssues: null
      },
      nonAdherenceReasons: {
        dryness: false,
        pressureTooHigh: false,
        anxiety: false,
        other: null
      }
    }
  },
  
  // Comorbidități la această vizită (tracking în timp)
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
  
  // Factori comportamentali
  behavioral: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  
  // Istoric ORL
  orlHistory: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  
  // Date psihosociale
  psychosocial: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  
  // Biomarkeri
  biomarkers: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  
  // Risc rutier
  drivingRisk: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: true
  },
  
  // Note clinice
  notes: {
    type: DataTypes.TEXT
  },
  
  // Medic înregistrator
  recordedById: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['patientId', 'visitDate']
    },
    {
      fields: ['visitDate']
    }
  ]
});

module.exports = Visit;
