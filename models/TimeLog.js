const mongoose = require("mongoose");

const timeLogSchema = new mongoose.Schema({
  task:         { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  staff:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  hoursWorked:  { type: Number, required: true, min: 0 },
  date:         { type: Date, default: Date.now },
  notes:        { type: String, default: "" },
  qualityRating: { type: Number, min: 1, max: 5, default: null },
  // Duyet gio lam: nguoi dung ghi -> pending -> admin duyet/tu choi
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
  approvedAt:   { type: Date, default: null },
  rejectedReason: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("TimeLog", timeLogSchema);
