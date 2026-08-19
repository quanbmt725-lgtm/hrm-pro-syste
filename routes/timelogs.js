const express = require('express');
const router = express.Router();
const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.staff) filter.staff = req.query.staff;
    if (req.query.task) filter.task = req.query.task;
    const logs = await TimeLog.find(filter)
      .populate({ path: 'task', select: 'name project', populate: { path: 'project', select: 'name' } })
      .populate('staff', 'fullName position')
      .sort('-date')
      .limit(parseInt(req.query.limit) || 100);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const log = await TimeLog.create(req.body);
    res.status(201).json(log);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/by-task/:taskId', async (req, res) => {
  try {
    const logs = await TimeLog.find({ task: req.params.taskId })
      .populate('staff', 'fullName position')
      .sort('-date');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-user/:userId', async (req, res) => {
  try {
    const logs = await TimeLog.find({ staff: req.params.userId })
      .populate({ path: 'task', select: 'name', populate: { path: 'project', select: 'name' } })
      .sort('-date');
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const log = await TimeLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'Khong tim thay log' });
    res.json({ message: 'Da xoa time log' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// ─── Admin: Duyet gio lam ────────────────────────────────────────────────────
// PUT /api/timelogs/:id/approve
router.put("/:id/approve", async (req, res) => {
  try {
    const { action, reason, approverId } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "action phai la approved hoac rejected." });
    }
    const log = await TimeLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: "Khong tim thay timelog." });
    log.approvalStatus = action;
    log.approvedBy     = approverId || null;
    log.approvedAt     = new Date();
    log.rejectedReason = action === "rejected" ? (reason || "") : "";
    await log.save();
    res.json({ message: action === "approved" ? "Da duyet gio lam." : "Da tu choi gio lam.", log });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: Lay danh sach gio lam cho duyet ──────────────────────────────────
// GET /api/timelogs/pending
router.get("/pending", async (req, res) => {
  try {
    const logs = await TimeLog.find({ approvalStatus: "pending" })
      .populate({ path: "task", select: "name project", populate: { path: "project", select: "name" } })
      .populate("staff", "fullName position department")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: Thong ke phe duyet ───────────────────────────────────────────────
// GET /api/timelogs/approval-stats
router.get("/approval-stats", async (req, res) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      TimeLog.countDocuments({ approvalStatus: "pending" }),
      TimeLog.countDocuments({ approvalStatus: "approved" }),
      TimeLog.countDocuments({ approvalStatus: "rejected" }),
    ]);
    res.json({ pending, approved, rejected, total: pending + approved + rejected });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;

