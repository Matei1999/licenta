const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SleepData = sequelize.define('SleepData', {
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
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  sleepDuration: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  cpapUsage: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ahiScore: {
    type: DataTypes.FLOAT
  },
  oxygenSaturation: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  leakRate: {
    type: DataTypes.FLOAT
  },
  events: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sleepQuality: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 10
    }
  },
  symptoms: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT
  },
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
      fields: ['patientId', 'date']
    }
  ]
});

module.exports = SleepData;
