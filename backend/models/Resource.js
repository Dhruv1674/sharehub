import mongoose from "mongoose";
const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  description: { type: String, default: "" },
  location: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  availabilityStart: { type: Date, default: null },
  availabilityEnd: { type: Date, default: null },
  maxBookingsPerDay: { type: Number, default: 1, min: 1 },
  requiresTraining: { type: Boolean, default: false },
  requiredTraining: { type: String, default: "" },
  requiresApproval: { type: Boolean, default: true },
  deposit: { type: Number, default: 0 },
  rules: { type: String, default: "" },
  imageUrl: { type: String, default: "" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model("Resource", resourceSchema);
