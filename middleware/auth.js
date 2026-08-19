const jwt = require("jsonwebtoken");
const Account = require("../models/Account");

const JWT_SECRET = process.env.JWT_SECRET || "hrm-pro-secret-key-2024";

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ error: "Chua dang nhap. Vui long dang nhap de tiep tuc." });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const account = await Account.findById(decoded.id).select("-password");
    if (!account) {
      return res.status(401).json({ error: "Tai khoan khong ton tai." });
    }
    if (!account.active) {
      return res.status(401).json({ error: "Tai khoan da bi vo hieu hoa." });
    }
    req.user = account;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token khong hop le." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token da het han. Vui long dang nhap lai." });
    }
    res.status(500).json({ error: err.message });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Khong co quyen truy cap. Chi admin moi duoc phep." });
};

// Generate JWT token (7 ngay)
exports.signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
};
