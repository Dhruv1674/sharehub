import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ["pending","approved","rejected","waitlisted","cancelled","completed"], default: "pending" },
  initialCondition: { notes: String, photoUrl: String, recordedAt: Date },
  finalCondition: { notes: String, photoUrl: String, recordedAt: Date },
  checkedInAt: Date,
  checkedOutAt: Date,
  decisionNote: String,
  queuePosition: Number
}, { timestamps: true });
bookingSchema.index({ resource: 1, startAt: 1, endAt: 1, status: 1 });
export default mongoose.model("Booking", bookingSchema);
