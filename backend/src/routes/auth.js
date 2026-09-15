import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import Admin from "../models/Admin.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
const dummyHash = "$2b$12$LQv3c1yqBWVHxkd0LQ4YCOaTBgf5JU5WjF7z4Z3N4f2W4wVqX2w7e";

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const admin = await Admin.findOne({ email, active: true }).select("+passwordHash +tokenVersion");
    const passwordOk = await bcrypt.compare(password, admin?.passwordHash || dummyHash);
    if (!admin || !passwordOk) return res.status(401).json({ message: "Email বা password সঠিক নয়।" });

    admin.lastLoginAt = new Date();
    await admin.save();
    const token = jwt.sign({ sub: String(admin._id), role: "admin", ver: admin.tokenVersion || 0 }, config.jwtSecret, { algorithm: "HS256", expiresIn: config.jwtExpiresIn });
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

router.put("/password", requireAdmin, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 12 || newPassword.length > 128)
      return res.status(422).json({ message: "নতুন password ১২–১২৮ অক্ষরের হতে হবে।" });
    if (currentPassword === newPassword)
      return res.status(422).json({ message: "নতুন password আগের password থেকে আলাদা হতে হবে।" });
    const admin = await Admin.findById(req.admin._id).select("+passwordHash +tokenVersion");
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash)))
      return res.status(401).json({ message: "বর্তমান password সঠিক নয়।" });
    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    admin.tokenVersion += 1;
    await admin.save();
    res.json({ ok: true, message: "Password পরিবর্তন হয়েছে। আবার login করুন।" });
  } catch (error) {
    next(error);
  }
});

export default router;
