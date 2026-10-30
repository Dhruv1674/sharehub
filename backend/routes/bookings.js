import { Router } from "express";
import Booking from "../models/Booking.js";
import Resource from "../models/Resource.js";
import User from "../models/User.js";
import Audit from "../models/Audit.js";
import { protect, allow } from "../middleware/auth.js";
import logAction from "../utils/audit.js";
const router = Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} :
      req.user.role === "owner" ? { owner: req.user._id } : { user: req.user._id };
    const rows = await Booking.find(filter).populate("resource").populate("user","name email").populate("owner","name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) { next(e); }
});
router.post("/", protect, allow("student"), async (req, res, next) => {
  try {
    const { resourceId, purpose, startAt, endAt } = req.body;
    if (!resourceId || !purpose || !startAt || !endAt) return res.status(400).json({ message: "Complete all booking fields" });
    const start = new Date(startAt), end = new Date(endAt);
    if (Number.isNaN(+start) || Number.isNaN(+end) || start <= new Date() || end <= start)
      return res.status(400).json({ message: "Choose a future time range with end after start" });
    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.active) return res.status(404).json({ message: "Resource unavailable" });
    if (String(resource.owner) === String(req.user._id)) return res.status(400).json({ message: "You cannot book your own resource" });
    if (resource.requiresTraining) {
      const user = await User.findById(req.user._id);
      if (!resource.requiredTraining || !user.training.includes(resource.requiredTraining))
        return res.status(403).json({ message: `Training required: ${resource.requiredTraining || "contact the owner"}` });
    }
    const activeCount = await Booking.countDocuments({ user: req.user._id, status: { $in: ["pending","approved","waitlisted"] }, endAt: { $gte: new Date() } });
    if (activeCount >= 3) return res.status(429).json({ message: "Fair-use limit reached: maximum 3 active/future requests at a time" });
    const conflict = await Booking.findOne({ resource: resourceId, status: "approved", startAt: { $lt: end }, endAt: { $gt: start } });
    const pendingConflict = await Booking.findOne({ resource: resourceId, status: "pending", startAt: { $lt: end }, endAt: { $gt: start } });
    let status = "pending", queuePosition;
    if (conflict || pendingConflict) {
      status = "waitlisted";
      queuePosition = (await Booking.countDocuments({ resource: resourceId, status: "waitlisted" })) + 1;
    } else if (!resource.requiresApproval) status = "approved";
    const booking = await Booking.create({ resource: resourceId, user: req.user._id, owner: resource.owner, purpose, startAt: start, endAt: end, status, queuePosition });
    await logAction(req.user._id, "BOOKING_REQUESTED", "Booking", booking._id, { resource: resource.title, status });
    res.status(201).json(booking);
  } catch (e) { next(e); }
});
router.patch("/:id/decision", protect, allow("owner","admin"), async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user.role !== "admin" && String(booking.owner) !== String(req.user._id)) return res.status(403).json({ message: "Not your booking" });
    if (!["approved","rejected"].includes(req.body.status)) return res.status(400).json({ message: "Decision must be approved or rejected" });
    if (booking.status !== "pending") return res.status(400).json({ message: "Only pending requests can be decided" });
    if (req.body.status === "approved") {
      const conflict = await Booking.findOne({ _id: { $ne: booking._id }, resource: booking.resource, status: "approved", startAt: { $lt: booking.endAt }, endAt: { $gt: booking.startAt } });
      if (conflict) return res.status(409).json({ message: "Time slot was just taken. Reject this request or ask the user to choose another time." });
    }
    booking.status = req.body.status;
    booking.decisionNote = req.body.note || "";
    await booking.save();
    await logAction(req.user._id, `BOOKING_${req.body.status.toUpperCase()}`, "Booking", booking._id, { note: booking.decisionNote });
    res.json(booking);
  } catch (e) { next(e); }
});
router.patch("/:id/cancel", protect, async (req, res, next) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: "Booking not found" });
    if (String(b.user) !== String(req.user._id) && String(b.owner) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "Not authorised" });
    if (!["pending","approved","waitlisted"].includes(b.status)) return res.status(400).json({ message: "Booking cannot be cancelled" });
    b.status = "cancelled"; await b.save();
    await logAction(req.user._id, "BOOKING_CANCELLED", "Booking", b._id);
    res.json(b);
  } catch (e) { next(e); }
});
router.patch("/:id/checkin", protect, allow("student"), async (req, res, next) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b || String(b.user) !== String(req.user._id)) return res.status(404).json({ message: "Booking not found" });
    if (b.status !== "approved" || b.checkedInAt) return res.status(400).json({ message: "Booking is not ready for check-in" });
    if (!req.body.notes) return res.status(400).json({ message: "Initial condition notes are required" });
    b.initialCondition = { notes: req.body.notes, photoUrl: req.body.photoUrl || "", recordedAt: new Date() };
    b.checkedInAt = new Date(); await b.save();
    await logAction(req.user._id, "CHECKED_IN", "Booking", b._id);
    res.json(b);
  } catch (e) { next(e); }
});
router.patch("/:id/checkout", protect, allow("student"), async (req, res, next) => {
  try {
    const b = await Booking.findById(req.params.id);
    if (!b || String(b.user) !== String(req.user._id)) return res.status(404).json({ message: "Booking not found" });
    if (!b.checkedInAt || b.checkedOutAt) return res.status(400).json({ message: "Check-in must be completed first" });
    if (!req.body.notes) return res.status(400).json({ message: "Return condition notes are required" });
    b.finalCondition = { notes: req.body.notes, photoUrl: req.body.photoUrl || "", recordedAt: new Date() };
    b.checkedOutAt = new Date(); b.status = "completed"; await b.save();
    await logAction(req.user._id, "CHECKED_OUT", "Booking", b._id);
    res.json(b);
  } catch (e) { next(e); }
});
router.get("/audit/all", protect, allow("owner","admin"), async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { actor: req.user._id };
    const rows = await Audit.find(filter).populate("actor","name").sort({ createdAt: -1 }).limit(100);
    res.json(rows);
  } catch (e) { next(e); }
});
export default router;
