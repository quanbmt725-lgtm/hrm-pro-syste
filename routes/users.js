const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    const users = await User.find(filter).populate('department', 'name color').sort('fullName');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(await user.populate('department', 'name color'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name color');
    if (!user) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('department', 'name color');
    if (!user) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    res.json({ message: 'Da xoa nhan vien' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:id/performance — computed performance stats
router.get('/:id/performance', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name color');
    if (!user) return res.status(404).json({ error: 'Khong tim thay nhan vien' });

    const tasks = await Task.find({ assignee: req.params.id });
    const logs = await TimeLog.find({ staff: req.params.id });

    const completed = tasks.filter(t => t.status === 'Completed');
    const onTime = completed.filter(t => t.completedAt && t.deadline && t.completedAt <= t.deadline);
    const onTimeRate = completed.length > 0 ? onTime.length / completed.length : 0;

    const totalHours = logs.reduce((s, l) => s + l.hoursWorked, 0);
    const avgQuality = logs.filter(l => l.qualityRating).length > 0
      ? logs.filter(l => l.qualityRating).reduce((s, l) => s + l.qualityRating, 0) / logs.filter(l => l.qualityRating).length
      : 0;

    res.json({
      user,
      stats: {
        totalTasks: tasks.length,
        completedTasks: completed.length,
        onTimeTasks: onTime.length,
        onTimeRate,
        totalHoursLogged: totalHours,
        avgQualityRating: avgQuality,
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
