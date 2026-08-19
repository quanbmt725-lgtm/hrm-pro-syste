/**
 * Khởi tạo tài khoản Admin mặc định khi lần đầu chạy server
 * Admin: username=admin, password=Admin@123
 * Chạy riêng biệt với seed data nhân viên/dự án
 */
const Account = require("../models/Account");

async function initAdminAccount() {
  try {
    const existing = await Account.findOne({ username: "admin" });
    if (existing) {
      return; // Admin đã tồn tại, bỏ qua
    }
    await Account.create({
      username: "admin",
      password: "Admin@123",
      fullName: "Quản trị viên hệ thống",
      email: "admin@hrmpro.com",
      role: "admin",
      active: true,
    });
    console.log("[Auth] Tai khoan admin mac dinh da duoc tao: admin / Admin@123");
    console.log("[Auth] Vui long doi mat khau sau lan dang nhap dau tien!");
  } catch (err) {
    console.error("[Auth] Loi tao admin:", err.message);
  }
}

module.exports = initAdminAccount;
