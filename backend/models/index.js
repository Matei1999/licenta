const User = require('./User');
const Patient = require('./Patient');
const SleepData = require('./SleepData');
const Visit = require('./Visit');
const AuditLog = require('./AuditLog');
const { sequelize } = require('../config/database');

// Define associations
User.hasMany(Patient, { 
  foreignKey: 'assignedDoctorId', 
  as: 'patients' 
});
Patient.belongsTo(User, { 
  foreignKey: 'assignedDoctorId', 
  as: 'assignedDoctor' 
});

Patient.hasMany(SleepData, { 
  foreignKey: 'patientId', 
  as: 'sleepData',
  onDelete: 'CASCADE'
});
SleepData.belongsTo(Patient, { 
  foreignKey: 'patientId', 
  as: 'patient' 
});

User.hasMany(SleepData, { 
  foreignKey: 'recordedById', 
  as: 'recordedData' 
});
SleepData.belongsTo(User, { 
  foreignKey: 'recordedById', 
  as: 'recordedBy' 
});

// Visit associations
Patient.hasMany(Visit, {
  foreignKey: 'patientId',
  as: 'visits',
  onDelete: 'CASCADE'
});
Visit.belongsTo(Patient, {
  foreignKey: 'patientId',
  as: 'patient'
});

User.hasMany(Visit, {
  foreignKey: 'recordedById',
  as: 'recordedVisits'
});
Visit.belongsTo(User, {
  foreignKey: 'recordedById',
  as: 'recordedBy'
});

// AuditLog associations
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs'
});
AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

module.exports = {
  sequelize,
  User,
  Patient,
  SleepData,
  Visit,
  AuditLog
};
