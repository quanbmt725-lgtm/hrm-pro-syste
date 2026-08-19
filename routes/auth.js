const express = require("express");
const router = express.Router();
const Account = require("../models/Account");
const User = require("../models/User");

// POST /api/auth/register - Dang ky tai khoan va tao User
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ error: "Họ tên, username và mật khẩu là bắt buộc." });
    }
    
    // Check exist
    const existing = await Account.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Username đã tồn tại." });
    }

    // Tao User truoc
    const newUser = new User({
      fullName,
      email: email || "",
    });
    await newUser.save();

    // Tao Account
    const newAccount = new Account({
      fullName,
      email: email || "",
      username,
      password,
      role: "user",
      linkedUser: newUser._id,
      lastLogin: new Date()
    });
    await newAccount.save();

    // Auto login
    const token = signToken(newAccount._id);
    res.json({
      message: "Đăng ký thành công.",
      token,
      user: {
        id: newAccount._id,
        username: newAccount.username,
        fullName: newAccount.fullName,
        email: newAccount.email,
        role: newAccount.role,
        lastLogin: newAccount.lastLogin,
      }
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

const { protect, signToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Vui long nhap username va mat khau." });
    }
    const account = await Account.findOne({ username: username.toLowerCase() }).select("+password");
    if (!account) {
      return res.status(401).json({ error: "Username hoac mat khau khong chinh xac." });
    }
    if (!account.active) {
      return res.status(401).json({ error: "Tai khoan da bi vo hieu hoa. Lien he admin." });
    }
    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Username hoac mat khau khong chinh xac." });
    }
    account.lastLogin = new Date();
    await account.save({ validateBeforeSave: false });

    const token = signToken(account._id);
    res.json({
      token,
      user: {
        id: account._id,
        username: account.username,
        fullName: account.fullName,
        email: account.email,
        role: account.role,
        lastLogin: account.lastLogin,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const account = await Account.findById(req.user._id)
      .populate("linkedUser", "fullName department position");
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Vui long nhap day du thong tin." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mat khau moi phai co it nhat 6 ky tu." });
    }
    const account = await Account.findById(req.user._id).select("+password");
    const isMatch = await account.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Mat khau hien tai khong chinh xac." });
    }
    account.password = newPassword;
    await account.save();
    res.json({ message: "Doi mat khau thanh cong." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// POST /api/auth/check-password - Kiem tra do manh mat khau (public)
router.post("/check-password", (req, res) => {
  const { password } = req.body;
  const pw = password || "";
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[!@#$%^&*()\-_,.?":{}|<>]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 1 ? "weak" : score === 2 ? "fair" : score === 3 ? "good" : "strong";
  const valid = Object.values(checks).every(Boolean);
  res.json({ valid, score, strength, checks });
});
module.exports = router;


