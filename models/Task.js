const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  project:        { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String, default: "" },
  assignee:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium",
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Pending Approval", "Completed", "Rejected"],
    default: "Not Started",
  },
  // Luong duyet: nguoi dung submit -> Pending Approval -> Admin duyet/tu choi
  approvalStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  approvedAt:   { type: Date, default: null },
  approvalNote: { type: String, default: "" },
  // ---
  estimatedHours: { type: Number, default: 8 },
  requiredSkills: [{ type: String, trim: true }],
  deadline:       { type: Date },
  completedAt:    { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
