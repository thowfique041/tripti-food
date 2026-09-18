import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    passwordHash: { type: String, required: true, select: false },
    tokenVersion: { type: Number, default: 0, min: 0, select: false },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("Admin", adminSchema);
