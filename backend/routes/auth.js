import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, institution } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "Name, email and password (6+ characters) are required" });
    if (!["student","owner"].includes(role || "student"))
      return res.status(400).json({ message: "Choose student or owner role during registration" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: role || "student", institution });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, institution: user.institution } });
  } catch (e) { next(e); }
});
router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(401).json({ message: "Incorrect email or password" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, institution: user.institution } });
  } catch (e) { next(e); }
});
router.get("/me", protect, (req, res) => res.json({ user: req.user }));
export default router;
