const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  entityType: {
    type: DataTypes.ENUM('patient', 'visit', 'sleepData', 'user'),
    allowNull: false
  },
  
  entityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  
  action: {
    type: DataTypes.ENUM('create', 'update', 'delete'),
    allowNull: false
  },
  
  changes: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Utilizatorul care a făcut modificarea'
  },
  
  userName: {
    type: DataTypes.STRING
  },
  
  ipAddress: {
    type: DataTypes.STRING
  },
  
  userAgent: {
    type: DataTypes.TEXT
  },
  
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // folosim câmpul timestamp custom
  indexes: [
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['action']
    }
  ]
});

module.exports = AuditLog;
