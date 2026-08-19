const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const Department = require('../models/Department');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProjects,
      projectsByStatus,
      totalUsers,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      recentLogs,
      projectProgress,
      deptWorkload,
      avgWorkloadArr,
      weeklyHours,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Task.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      TimeLog.find()
        .populate({ path: 'task', select: 'name', populate: { path: 'project', select: 'name' } })
        .populate('staff', 'fullName')
        .sort('-date').limit(8),
      Project.find({}, 'name progress status department').populate('department', 'name color').sort('-progress').limit(10),
      User.aggregate([
        { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        { $group: { _id: '$dept._id', name: { $first: '$dept.name' }, color: { $first: '$dept.color' }, avgWorkload: { $avg: '$workloadPercent' }, count: { $sum: 1 } } },
      ]),
      User.aggregate([{ $group: { _id: null, avg: { $avg: '$workloadPercent' } } }]),
      // Hours logged per day for last 7 days
      TimeLog.aggregate([
        { $match: { date: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, hours: { $sum: '$hoursWorked' } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      totalProjects,
      projectsByStatus,
      totalUsers,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      recentLogs,
      projectProgress,
      deptWorkload,
      avgWorkload: avgWorkloadArr[0]?.avg?.toFixed(1) || 0,
      weeklyHours,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
