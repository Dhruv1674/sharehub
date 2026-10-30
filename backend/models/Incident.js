import mongoose from "mongoose";
const incidentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["damage","delay","safety","other"], default: "other" },
  description: { type: String, required: true },
  photoUrl: String,
  status: { type: String, enum: ["open","reviewing","resolved"], default: "open" },
  resolution: String
}, { timestamps: true });
export default mongoose.model("Incident", incidentSchema);
