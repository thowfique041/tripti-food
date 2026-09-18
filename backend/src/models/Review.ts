import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  phoneLast4: { type: String, required: true, match: /^\d{4}$/ },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
  approved: { type: Boolean, default: false, index: true },
}, { timestamps: true });

reviewSchema.index({ order: 1, product: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
