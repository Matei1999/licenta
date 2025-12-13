const express = require('express');
const router = express.Router();
const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get audit logs with filters
// @access  Private (admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const {  
      entityType,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      limit = 100
    } = req.query;
    
    const where = {};
    
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }
    
    const logs = await AuditLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @desc    Get audit logs for a specific entity
// @access  Private
router.get('/entity/:entityType/:entityId', auth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const logs = await AuditLog.findAll({
      where: {
        entityType,
        entityId
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 500 // Keep last 500 changes for an entity
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/audit-logs
// @desc    Create audit log entry (normally done automatically via middleware)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const logData = {
      ...req.body,
      userId: req.user.id,
      userName: req.user.name,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    const log = await AuditLog.create(logData);
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/audit-logs/cleanup
// @desc    Clean up old audit logs (keep last 6 months)
// @access  Private (admin only)
router.delete('/cleanup', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const deletedCount = await AuditLog.destroy({
      where: {
        timestamp: {
          [Op.lt]: sixMonthsAgo
        }
      }
    });
    
    res.json({ 
      message: `Cleaned up ${deletedCount} old audit log entries`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
