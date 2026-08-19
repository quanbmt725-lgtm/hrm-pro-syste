const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    const projects = await Project.find(filter).populate('department').sort('-createdAt');
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
    const project = await Project.findById(req.params.id).populate('department');
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('department');
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
