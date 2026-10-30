import Audit from "../models/Audit.js";
export default async function logAction(actor, action, targetType, targetId, details = {}) {
  await Audit.create({ actor, action, targetType, targetId: String(targetId || ""), details });
}
