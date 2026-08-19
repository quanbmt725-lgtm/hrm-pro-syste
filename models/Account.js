const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Kiem tra do manh mat khau
function validatePassword(pw) {
  if (!pw || pw.length < 8) return false;
  if (!/[A-Z]/.test(pw)) return false;  // Can chu hoa
  if (!/[0-9]/.test(pw)) return false;  // Can chu so
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pw)) return false; // Can ky tu dac biet
  return true;
}

const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username la bat buoc"],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, "Username phai co it nhat 3 ky tu"],
    match: [/^[a-z0-9_]+$/, "Username chi duoc chua chu thuong, so va dau gach duoi"],
  },
  password: {
    type: String,
    required: [true, "Mat khau la bat buoc"],
    select: false,
    validate: {
      validator: function(v) {
        // Chi validate khi chua hash (truoc pre-save hook)
        if (this.isModified("password") && !v.startsWith("$2")) {
          return validatePassword(v);
        }
        return true;
      },
      message: "Mat khau phai co it nhat 8 ky tu, 1 chu hoa, 1 chu so va 1 ky tu dac biet (!@#$...)",
    },
  },
  fullName: {
    type: String,
    required: [true, "Ho ten la bat buoc"],
    trim: true,
  },
  email: { type: String, trim: true, lowercase: true },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  active: { type: Boolean, default: true },
  linkedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  lastLogin: { type: Date, default: null },
  loginCount: { type: Number, default: 0 },
  // Ghi chu noi bo (admin them)
  adminNote: { type: String, default: "" },
}, { timestamps: true });

// Hash password truoc khi luu
accountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sanh password
accountSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export ham validate de dung o frontend API
accountSchema.statics.checkPasswordStrength = function(pw) {
  const result = { valid: true, errors: [] };
  if (!pw || pw.length < 8) result.errors.push("It nhat 8 ky tu");
  if (!/[A-Z]/.test(pw)) result.errors.push("It nhat 1 chu hoa (A-Z)");
  if (!/[0-9]/.test(pw)) result.errors.push("It nhat 1 chu so (0-9)");
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pw)) result.errors.push("It nhat 1 ky tu dac biet (!@#...)");
  if (result.errors.length > 0) result.valid = false;
  return result;
};

module.exports = mongoose.model("Account", accountSchema);
