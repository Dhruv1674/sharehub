import mongoose from "mongoose";
const auditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true },
  targetType: String,
  targetId: String,
  details: mongoose.Schema.Types.Mixed
}, { timestamps: true });
export default mongoose.model("Audit", auditSchema);
