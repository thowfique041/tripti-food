import jwt from "jsonwebtoken";
import { config } from "../config.js";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  const header = req.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "অনুমতি নেই।" });
  try {
    const data = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ["HS256"] });
    if (data.role !== "admin") throw new Error("Invalid role");
    const admin = await Admin.findOne({ _id: data.sub, active: true }).select("_id email +tokenVersion").lean();
    if (!admin || (admin.tokenVersion || 0) !== (data.ver || 0)) throw new Error("Admin not found");
    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Session শেষ হয়েছে। আবার login করুন।" });
  }
}
