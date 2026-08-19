const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/accounts - Danh sach tai khoan (admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const accounts = await Account.find()
      .populate("linkedUser", "fullName department position")
      .sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts - Tao tai khoan moi (admin only)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { username, password, fullName, email, role, linkedUser } = req.body;
    const existing = await Account.findOne({ username: username ? username.toLowerCase() : "" });
    if (existing) {
      return res.status(400).json({ error: "Username nay da ton tai." });
    }
    const account = await Account.create({
      username, password, fullName, email, role,
      linkedUser: linkedUser || null
    });
    res.status(201).json(account);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Username da ton tai." });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id - Cap nhat thong tin (admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { fullName, email, role, active, linkedUser } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { fullName, email, role, active, linkedUser: linkedUser || null },
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ error: "Khong tim thay tai khoan." });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/accounts/:id/reset-password - Reset mat khau (admin only)
router.put("/:id/reset-password", protect, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "Mat khau moi phai co it nhat 6 ky tu." });
    }
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ error: "Khong tim thay tai khoan." });
    account.password = newPassword;
    await account.save();
    res.json({ message: "Da reset mat khau thanh cong." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/:id - Xoa tai khoan (admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ error: "Khong tim thay tai khoan." });
    if (account.username === "admin") {
      return res.status(400).json({ error: "Khong the xoa tai khoan admin chinh." });
    }
    await account.deleteOne();
    res.json({ message: "Da xoa tai khoan thanh cong." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
