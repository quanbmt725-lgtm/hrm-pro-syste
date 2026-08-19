const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const ProjectRequest = require('../models/ProjectRequest');
const { protect } = require('../middleware/auth');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    const projects = await Project.find(filter)
      .populate('department')
      .populate('members', 'fullName email')
      .sort('-createdAt');
    res.json(projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/projects/requests/pending - Admin lay danh sach yeu cau cho duyet
router.get('/requests/pending', protect, async (req, res) => {
  try {
    const requests = await ProjectRequest.find({ status: 'pending' })
      .populate('project', 'name department')
      .populate('user', 'fullName email position department')
      .populate('account', 'username fullName')
      .sort('-createdAt');
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/projects/requests/:requestId/approve - Admin duyet hoac tu choi yeu cau
router.put('/requests/:requestId/approve', protect, async (req, res) => {
  try {
    const { action, note } = req.body; // action: 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Action khong hop le' });
    }

    const pr = await ProjectRequest.findById(req.params.requestId);
    if (!pr) return res.status(404).json({ error: 'Khong tim thay yeu cau' });
    if (pr.status !== 'pending') {
      return res.status(400).json({ error: 'Yeu cau da duoc xu ly truoc do' });
    }

    pr.status = action;
    pr.approver = req.user._id;
    pr.approverNote = note || '';
    pr.approvedAt = new Date();
    await pr.save();

    // If approved, update the Project members
    if (action === 'approved') {
      const project = await Project.findById(pr.project);
      if (project) {
        if (!project.members) project.members = [];
        if (pr.type === 'join') {
          if (!project.members.some(m => m.toString() === pr.user.toString())) {
            project.members.push(pr.user);
            await project.save();
          }
        } else if (pr.type === 'leave') {
          project.members = project.members.filter(m => m.toString() !== pr.user.toString());
          await project.save();
        }
      }
    }

    res.json({ message: action === 'approved' ? 'Da phe duyet yeu cau' : 'Da tu choi yeu cau', request: pr });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/projects/requests/:requestId - Nguoi dung huy yeu cau
router.delete('/requests/:requestId', protect, async (req, res) => {
  try {
    const pr = await ProjectRequest.findById(req.params.requestId);
    if (!pr) return res.status(404).json({ error: 'Khong tim thay yeu cau' });
    if (pr.status !== 'pending') {
      return res.status(400).json({ error: 'Chi co the huy yeu cau dang cho duyet' });
    }
    await ProjectRequest.findByIdAndDelete(req.params.requestId);
    res.json({ message: 'Da huy yeu cau thanh cong' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects - Tao du an moi
router.post('/', async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(await project.populate('department'));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/projects/:id/my-request - Lay yeu cau pending cua user hien tai cho du an nay
router.get('/:id/my-request', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.linkedUser) return res.json(null);

    const pendingRequest = await ProjectRequest.findOne({
      project: req.params.id,
      user: user.linkedUser,
      status: 'pending'
    }).sort('-createdAt');

    res.json(pendingRequest);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/request-join - Gui yeu cau tham gia
router.post('/:id/request-join', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.linkedUser) {
      return res.status(400).json({ error: 'Tai khoan chua lien ket voi ho so nhan vien' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });

    // Check if already a member
    if (project.members && project.members.some(m => m.toString() === user.linkedUser.toString())) {
      return res.status(400).json({ error: 'Ban da la thanh vien cua du an nay roi' });
    }

    // Check if pending request already exists
    const existing = await ProjectRequest.findOne({
      project: req.params.id,
      user: user.linkedUser,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ error: 'Ban da co yeu cau dang cho duyet cho du an nay' });
    }

    const request = await ProjectRequest.create({
      project: req.params.id,
      user: user.linkedUser,
      account: user._id,
      type: 'join',
      reason: req.body.reason || '',
    });

    res.status(201).json({ message: 'Da gui yeu cau tham gia du an', request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/projects/:id/request-leave - Gui yeu cau roi du an
router.post('/:id/request-leave', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.linkedUser) {
      return res.status(400).json({ error: 'Tai khoan chua lien ket voi ho so nhan vien' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });

    // Check if not a member
    if (!project.members || !project.members.some(m => m.toString() === user.linkedUser.toString())) {
      return res.status(400).json({ error: 'Ban chua phai la thanh vien cua du an nay' });
    }

    // Check if pending request already exists
    const existing = await ProjectRequest.findOne({
      project: req.params.id,
      user: user.linkedUser,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ error: 'Ban da co yeu cau dang cho duyet cho du an nay' });
    }

    const request = await ProjectRequest.create({
      project: req.params.id,
      user: user.linkedUser,
      account: user._id,
      type: 'leave',
      reason: req.body.reason || '',
    });

    res.status(201).json({ message: 'Da gui yeu cau roi du an', request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET project by id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('department')
      .populate('members', 'fullName email position department skills');
    if (!project) return res.status(404).json({ error: 'Khong tim thay du an' });
    res.json(project);
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
    await ProjectRequest.deleteMany({ project: req.params.id });
    res.json({ message: 'Da xoa du an va cac thong tin lien quan' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
