const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');

// Compute composite score + radar data for a user
async function computeUserMetrics(user) {
  const tasks = await Task.find({ assignee: user._id });
  const logs = await TimeLog.find({ staff: user._id });

  const completed = tasks.filter(t => t.status === 'Completed');
  const onTime = completed.filter(t => t.completedAt && t.deadline && t.completedAt <= t.deadline);
  const onTimeRate = completed.length > 0 ? onTime.length / completed.length : 0;

  const totalHours = logs.reduce((s, l) => s + l.hoursWorked, 0);
  const ratedLogs = logs.filter(l => l.qualityRating != null);
  const avgQuality = ratedLogs.length > 0
    ? ratedLogs.reduce((s, l) => s + l.qualityRating, 0) / ratedLogs.length
    : 3.0;

  // Normalize task volume (max ~15 tasks = 1.0)
  const normalizedVolume = Math.min(tasks.length / 15, 1.0);

  // Composite score: 40% onTimeRate, 30% volume, 30% quality (normalized to 10)
  const qualityNorm = (avgQuality - 1) / 4; // scale 1-5 → 0-1
  const compositeScore = (0.40 * onTimeRate + 0.30 * normalizedVolume + 0.30 * qualityNorm) * 10;

  // ── Radar dimensions (0–10) ────────────────────────────────────────────
  const expertise = user.performanceScore; // from base profile
  const timeliness = onTimeRate * 10;
  const volume = normalizedVolume * 10;
  const responsibility = qualityNorm * 10;
  // Effort: hours worked vs estimated
  const totalEstimated = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const effort = totalEstimated > 0 ? Math.min((totalHours / totalEstimated) * 10, 10) : 5;

  // ── Cluster ───────────────────────────────────────────────────────────
  let cluster, clusterLabel, clusterNote;
  if (compositeScore >= 8.0) {
    cluster = 'high';
    clusterLabel = 'Hieu suat cao';
    clusterNote = 'San sang nhan them du an phuc tap, la nguon luc uu tien';
  } else if (compositeScore >= 6.0) {
    cluster = 'medium';
    clusterLabel = 'Trung binh';
    clusterNote = 'Co tiem nang phat trien, nen duoc mentoring them';
  } else {
    cluster = 'low';
    clusterLabel = 'Can cai thien';
    clusterNote = 'Can xay dung ke hoach cai thien ro rang va ho tro sat sao';
  }

  return {
    user,
    compositeScore: Math.round(compositeScore * 10) / 10,
    cluster,
    clusterLabel,
    clusterNote,
    stats: {
      totalTasks: tasks.length,
      completedTasks: completed.length,
      onTimeTasks: onTime.length,
      onTimeRate: Math.round(onTimeRate * 100),
      totalHoursLogged: Math.round(totalHours * 10) / 10,
      avgQualityRating: Math.round(avgQuality * 10) / 10,
    },
    radarData: {
      expertise: Math.round(expertise * 10) / 10,
      timeliness: Math.round(timeliness * 10) / 10,
      volume: Math.round(volume * 10) / 10,
      responsibility: Math.round(responsibility * 10) / 10,
      effort: Math.round(effort * 10) / 10,
    },
  };
}

// GET /api/performance/report
router.get('/report', async (req, res) => {
  try {
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    const users = await User.find(filter).populate('department', 'name color');

    const metrics = await Promise.all(users.map(u => computeUserMetrics(u)));
    metrics.sort((a, b) => b.compositeScore - a.compositeScore);

    // Summary
    const high = metrics.filter(m => m.cluster === 'high').length;
    const medium = metrics.filter(m => m.cluster === 'medium').length;
    const low = metrics.filter(m => m.cluster === 'low').length;
    const avgScore = metrics.reduce((s, m) => s + m.compositeScore, 0) / (metrics.length || 1);

    res.json({
      users: metrics,
      summary: {
        total: metrics.length,
        high,
        medium,
        low,
        avgScore: Math.round(avgScore * 10) / 10,
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/performance/user/:id
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name color');
    if (!user) return res.status(404).json({ error: 'Khong tim thay nhan vien' });
    const metrics = await computeUserMetrics(user);
    res.json(metrics);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
