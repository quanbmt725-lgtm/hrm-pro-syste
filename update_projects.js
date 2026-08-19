const fs = require('fs');
const content = `const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth'); // Require auth middleware for join/leave

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    const projects = await Project.find(filter)
      .populate('department')
      .populate('members', 'fullName email') // Populate members
      .sort('-createdAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(await project.populate('department'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('department')
      .populate('members', 'fullName email position department skills');
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User joins a project
router.post('/:id/join', auth, async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    if (!user || !user.linkedUser) return res.status(400).json({ error: 'Tai khoan chua lien ket ho so nhan vien' });
    
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });

    if (!project.members) project.members = [];
    if (!project.members.includes(user.linkedUser)) {
      project.members.push(user.linkedUser);
      await project.save();
    }
    res.json({ message: 'Da tham gia du an', project });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// User leaves a project
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.linkedUser) return res.status(400).json({ error: 'Tai khoan chua lien ket ho so nhan vien' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });

    if (project.members) {
      project.members = project.members.filter(m => m.toString() !== user.linkedUser.toString());
      await project.save();
    }
    res.json({ message: 'Da roi du an', project });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('department')
      .populate('members', 'fullName email');
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });
    res.json(project);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });
    await Task.deleteMany({ project: req.params.id });
    res.json({ message: 'Da xoa du an va cac task lien quan' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
`;
fs.writeFileSync('C:/Users/Quan/Downloads/code/test_manager/routes/projects.js', content, 'utf8');
