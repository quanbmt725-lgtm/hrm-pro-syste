const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort('name');
    res.json(departments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Khong tim thay phong ban' });
    res.json(dept);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ error: 'Khong tim thay phong ban' });
    res.json(dept);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Khong tim thay phong ban' });
    res.json({ message: 'Da xoa phong ban' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
