import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import resourceRoutes from "./routes/resources.js";
import bookingRoutes from "./routes/bookings.js";
import incidentRoutes from "./routes/incidents.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => res.json({ name: "ShareHub API", status: "running" }));
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/incidents", incidentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`ShareHub API running on ${PORT}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
