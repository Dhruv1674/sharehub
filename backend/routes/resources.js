import { Router } from "express";
import Resource from "../models/Resource.js";
import Booking from "../models/Booking.js";
import Audit from "../models/Audit.js";
import { protect, allow } from "../middleware/auth.js";
import logAction from "../utils/audit.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const q = {};
    if (req.query.search) q.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { category: { $regex: req.query.search, $options: "i" } },
      { location: { $regex: req.query.search, $options: "i" } }
    ];
    if (req.query.category) q.category = req.query.category;
    if (req.query.mine === "true" && req.user) q.owner = req.user._id;
    q.active = true;
    const resources = await Resource.find(q).populate("owner", "name institution").sort({ createdAt: -1 });
    res.json(resources);
  } catch (e) { next(e); }
});
router.post("/", protect, allow("owner","admin"), async (req, res, next) => {
  try {
    const { title, category, location } = req.body;
    if (!title || !category || !location) return res.status(400).json({ message: "Title, category and location are required" });
    const resource = await Resource.create({ ...req.body, owner: req.user._id });
    await logAction(req.user._id, "RESOURCE_CREATED", "Resource", resource._id, { title });
    res.status(201).json(resource);
  } catch (e) { next(e); }
});
router.get("/:id", async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("owner", "name institution");
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json(resource);
  } catch (e) { next(e); }
});
router.patch("/:id", protect, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    if (String(resource.owner) !== String(req.user._id) && req.user.role !== "admin")
      return res.status(403).json({ message: "Only the owner can update this resource" });
    const allowed = ["title","category","description","location","maxBookingsPerDay","requiresTraining","requiredTraining","requiresApproval","deposit","rules","imageUrl","active"];
    allowed.forEach(k => { if (req.body[k] !== undefined) resource[k] = req.body[k]; });
    await resource.save();
    await logAction(req.user._id, "RESOURCE_UPDATED", "Resource", resource._id);
    res.json(resource);
  } catch (e) { next(e); }
});
router.get("/:id/history", protect, async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    const rows = await Audit.find({ targetId: String(resource._id) }).populate("actor", "name").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) { next(e); }
});
export default router;
