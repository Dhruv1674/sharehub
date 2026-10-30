import { Router } from "express";
import Incident from "../models/Incident.js";
import Booking from "../models/Booking.js";
import { protect, allow } from "../middleware/auth.js";
import logAction from "../utils/audit.js";
const router = Router();
router.get("/", protect, async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : req.user.role === "owner" ? {} : { reporter: req.user._id };
    res.json(await Incident.find(filter).populate("booking").populate("reporter","name").sort({ createdAt: -1 }));
  } catch(e) { next(e); }
});
router.post("/", protect, async (req, res, next) => {
  try {
    const { bookingId, type, description, photoUrl } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (![String(booking.user),String(booking.owner)].includes(String(req.user._id)) && req.user.role !== "admin")
      return res.status(403).json({ message: "Only booking parties can report an incident" });
    if (!description) return res.status(400).json({ message: "Description is required" });
    const incident = await Incident.create({ booking: bookingId, reporter: req.user._id, type, description, photoUrl });
    await logAction(req.user._id, "INCIDENT_REPORTED", "Incident", incident._id, { type });
    res.status(201).json(incident);
  } catch(e) { next(e); }
});
router.patch("/:id", protect, allow("owner","admin"), async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    incident.status = req.body.status || incident.status;
    incident.resolution = req.body.resolution || incident.resolution;
    await incident.save();
    await logAction(req.user._id, "INCIDENT_UPDATED", "Incident", incident._id, { status: incident.status });
    res.json(incident);
  } catch(e) { next(e); }
});
export default router;
