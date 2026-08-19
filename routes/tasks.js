const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const TimeLog = require('../models/TimeLog');

// â”€â”€ AI Suggest (must be before /:id routes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/tasks/ai-suggest?skills=Python,React&excludeUserId=xxx
router.get('/ai-suggest', async (req, res) => {
  try {
    const requiredSkills = req.query.skills
      ? req.query.skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const excludeId = req.query.excludeUserId || null;

    const query = {};
    if (excludeId) query._id = { $ne: excludeId };

    const users = await User.find(query).populate('department', 'name color');

    const scored = users.map(user => {
      // â”€â”€ Skill Match Ratio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const matchedSkills = requiredSkills.filter(s =>
        user.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())
      );
      const skillMatch = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1.0;

      // â”€â”€ Workload Factor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const workloadFactor = 1 - (user.workloadPercent / 100);

      // â”€â”€ Performance Score â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const perfNorm = user.performanceScore / 10;

      // â”€â”€ MCDM Composite Score â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const totalScore = 0.40 * skillMatch + 0.35 * workloadFactor + 0.25 * perfNorm;

      // â”€â”€ Explanation text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const explanations = [];
      explanations.push(
        requiredSkills.length === 0
          ? 'Khong co ky nang yeu cau â€” mac dinh tron ven'
          : `Khop ${matchedSkills.length}/${requiredSkills.length} ky nang yeu cau (${Math.round(skillMatch * 100)}%)`
      );
      explanations.push(
        user.workloadPercent <= 40
          ? `Workload hien tai ${user.workloadPercent}% â€” Con nhieu nang luc`
          : user.workloadPercent <= 70
          ? `Workload hien tai ${user.workloadPercent}% â€” Muc hop ly`
          : `Workload hien tai ${user.workloadPercent}% â€” Tuong doi ban`
      );
      explanations.push(`Hieu suat lich su ${user.performanceScore.toFixed(1)}/10`);

      return {
        user,
        totalScore: Math.round(totalScore * 1000) / 1000,
        breakdown: {
          skillMatch: Math.round(skillMatch * 100) / 100,
          matchedSkills,
          unmatchedSkills: requiredSkills.filter(s =>
            !user.skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())
          ),
          workloadFactor: Math.round(workloadFactor * 100) / 100,
          workloadPercent: user.workloadPercent,
          performanceScore: user.performanceScore,
          perfNorm: Math.round(perfNorm * 100) / 100,
          weights: { skill: 0.40, workload: 0.35, performance: 0.25 },
          scoreContributions: {
            skill: Math.round(0.40 * skillMatch * 1000) / 1000,
            workload: Math.round(0.35 * workloadFactor * 1000) / 1000,
            performance: Math.round(0.25 * perfNorm * 1000) / 1000,
          },
        },
        explanations,
      };
    });

    // Sort descending, return top 3
    const top3 = scored.sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);
    res.json({ suggestions: top3, requiredSkills });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// â”€â”€ CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.assignee) filter.assignee = req.query.assignee;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter)
      .populate('project', 'name status')
      .populate({ path: 'assignee', select: 'fullName position workloadPercent', populate: { path: 'department', select: 'name color' } })
      .sort({ priority: -1, deadline: 1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const populated = await Task.findById(task._id)
      .populate('project', 'name status')
      .populate({ path: 'assignee', select: 'fullName position workloadPercent', populate: { path: 'department', select: 'name color' } });
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/pending-approval", async (req, res) => {
  try {
    const tasks = await Task.find({ approvalStatus: "pending" })
      .populate("project", "name")
      .populate({ path: "assignee", select: "fullName position", populate: { path: "department", select: "name color" } })
      .sort({ updatedAt: -1 });

router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name status deadline')
      .populate({ path: 'assignee', populate: { path: 'department', select: 'name color' } });
    if (!task) return res.status(404).json({ error: 'Khong tim thay task' });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    // Auto set completedAt when status changes to Completed
    if (req.body.status === 'Completed' && !req.body.completedAt) {
      req.body.completedAt = new Date();
    }
    if (req.body.status !== 'Completed') {
      req.body.completedAt = null;
    }
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('project', 'name status')
      .populate({ path: 'assignee', select: 'fullName position workloadPercent', populate: { path: 'department', select: 'name color' } });
    if (!task) return res.status(404).json({ error: 'Khong tim thay task' });
    res.json(task);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Khong tim thay task' });
    await TimeLog.deleteMany({ task: req.params.id });
    res.json({ message: 'Da xoa task va cac timelog lien quan' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// ─── Submit de duyet (user) ──────────────────────────────────────────────────
// PUT /api/tasks/:id/submit-approval
router.put("/:id/submit-approval", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Khong tim thay task." });
    if (task.status !== "In Progress") {
      return res.status(400).json({ error: "Chi co the gui duyet task dang thuc hien." });
    }
    task.status = "Pending Approval";
    task.approvalStatus = "pending";
    task.approvalNote = req.body.note || "";
    await task.save();
    res.json({ message: "Da gui yeu cau duyet.", task });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: Duyet task ───────────────────────────────────────────────────────
// PUT /api/tasks/:id/approve
router.put("/:id/approve", async (req, res) => {
  try {
    const { action, note, approverId } = req.body; // action: "approved" | "rejected"
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ error: "action phai la approved hoac rejected." });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Khong tim thay task." });
    if (task.approvalStatus !== "pending") {
      return res.status(400).json({ error: "Task nay khong co yeu cau duyet." });
    }
    task.approvalStatus = action;
    task.approvedBy = approverId || null;
    task.approvedAt = new Date();
    task.approvalNote = note || task.approvalNote;
    if (action === "approved") {
      task.status = "Completed";
      task.completedAt = new Date();
    } else {
      task.status = "In Progress"; // Tra lai dang lam
    }
    await task.save();
    res.json({ message: action === "approved" ? "Da duyet task." : "Da tu choi duyet.", task });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin: Lay danh sach task cho duyet ─────────────────────────────────────

    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;

