import { Router } from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Settings from "../models/Settings.js";
import Review from "../models/Review.js";
import { requireAdmin } from "../middleware/auth.js";
import { clean, productInput, validEmail, validObjectId, validPhone } from "../utils/validate.js";
import { canChangeOrderStatus, orderStatuses, restockOperations } from "../utils/orders.js";

const router = Router();
router.use(requireAdmin);

router.get("/orders", async (req, res, next) => {
  try { res.json({ orders: await Order.find().sort({ createdAt: -1 }).limit(200).lean() }); }
  catch (error) { next(error); }
});

router.get("/reviews", async (req, res, next) => {
  try { res.json({ reviews: await Review.find().populate("product", "name").sort({ createdAt: -1 }).limit(200).lean() }); }
  catch (error) { next(error); }
});

router.patch("/reviews/:id", async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id) || typeof req.body.approved !== "boolean") throw Object.assign(new Error("তথ্য সঠিক নয়।"), { status: 422 });
    const review = await Review.findByIdAndUpdate(req.params.id, { approved: req.body.approved }, { new: true });
    if (!review) throw Object.assign(new Error("Review পাওয়া যায়নি।"), { status: 404 });
    res.json({ review });
  } catch (error) { next(error); }
});

router.delete("/reviews/:id", async (req, res, next) => {
  try { if (!validObjectId(req.params.id)) throw Object.assign(new Error("Review পাওয়া যায়নি।"), { status: 404 }); await Review.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (error) { next(error); }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const status = req.body.status;
    const hasPaymentVerified = typeof req.body.paymentVerified === "boolean";
    const hasCourier = req.body.courier && typeof req.body.courier === "object";
    if (!validObjectId(req.params.id) || (status !== undefined && !orderStatuses.includes(status)) || (status === undefined && !hasPaymentVerified && !hasCourier))
      throw Object.assign(new Error("তথ্য সঠিক নয়।"), { status: 422 });

    const current = await Order.findById(req.params.id).lean();
    if (!current) throw Object.assign(new Error("অর্ডার পাওয়া যায়নি।"), { status: 404 });
    if (status === undefined && hasCourier) {
      const source = req.body.courier;
      const charge = Number(source.charge || 0);
      const shippedAt = source.shippedAt ? new Date(source.shippedAt) : null;
      const courier = { company: clean(source.company, 50), trackingId: clean(source.trackingId, 80), trackingUrl: clean(source.trackingUrl, 500), charge, shippedAt };
      if (!courier.company || !courier.trackingId || (courier.trackingUrl && !/^https:\/\/[^\s]+$/i.test(courier.trackingUrl)) || !Number.isFinite(charge) || charge < 0 || charge > 100000 || (shippedAt && Number.isNaN(shippedAt.getTime())))
        throw Object.assign(new Error("Courier-এর তথ্য সঠিকভাবে দিন।"), { status: 422 });
      const order = await Order.findByIdAndUpdate(req.params.id, { courier }, { new: true, runValidators: true });
      return res.json({ order });
    }
    if (status === undefined) {
      if (req.body.paymentVerified === false && !["pending", "cancelled"].includes(current.status))
        throw Object.assign(new Error("নিশ্চিত বা পাঠানো অর্ডারের payment verification সরানো যাবে না।"), { status: 409 });
      const order = await Order.findByIdAndUpdate(req.params.id, { paymentVerified: req.body.paymentVerified }, { new: true, runValidators: true });
      return res.json({ order });
    }
    if (current.status === status) return res.json({ order: current });
    if (current.status === "cancelled")
      throw Object.assign(new Error("বাতিল অর্ডারের status আবার পরিবর্তন করা যাবে না।"), { status: 409 });
    if (!canChangeOrderStatus(current, status))
      throw Object.assign(new Error("Online payment যাচাই না হওয়া পর্যন্ত অর্ডারটি শুধু বাতিল করা যাবে।"), { status: 409 });

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, status: current.status }, { status }, { new: true },
    );
    if (!order)
      throw Object.assign(new Error("অর্ডারটি ইতোমধ্যে পরিবর্তিত হয়েছে। আবার চেষ্টা করুন।"), { status: 409 });

    if (status === "cancelled") {
      try {
        const operations = restockOperations(order.items);
        if (operations.length) await Product.bulkWrite(operations);
      } catch (error) {
        await Order.updateOne({ _id: order._id, status: "cancelled" }, { status: current.status });
        throw error;
      }
    }
    res.json({ order });
  } catch (error) { next(error); }
});

router.post("/products", async (req, res, next) => {
  try { res.status(201).json({ product: await Product.create(productInput(req.body)) }); }
  catch (error) { next(error); }
});

router.put("/products/:id", async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) throw Object.assign(new Error("পণ্য পাওয়া যায়নি।"), { status: 404 });
    const product = await Product.findByIdAndUpdate(req.params.id, productInput(req.body), { new: true, runValidators: true });
    if (!product) throw Object.assign(new Error("পণ্য পাওয়া যায়নি।"), { status: 404 });
    res.json({ product });
  } catch (error) { next(error); }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) throw Object.assign(new Error("পণ্য পাওয়া যায়নি।"), { status: 404 });
    const product = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!product) throw Object.assign(new Error("পণ্য পাওয়া যায়নি।"), { status: 404 });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.put("/settings", async (req, res, next) => {
  try {
    const data = { email: clean(req.body.email, 120).toLowerCase(), phone: clean(req.body.phone, 11), whatsapp: clean(req.body.whatsapp, 13), address: clean(req.body.address, 200), deliveryDhaka: Number(req.body.deliveryDhaka), deliveryOutside: Number(req.body.deliveryOutside) };
    if (!validEmail(data.email) || !validPhone(data.phone) || !/^8801[3-9]\d{8}$/.test(data.whatsapp) || data.address.length < 3 || ![data.deliveryDhaka, data.deliveryOutside].every((value) => Number.isFinite(value) && value >= 0 && value <= 5000))
      throw Object.assign(new Error("সেটিংস সঠিকভাবে দিন।"), { status: 422 });
    const settings = await Settings.findOneAndUpdate({ key: "store" }, { $set: data }, { new: true, upsert: true, runValidators: true });
    res.json({ settings });
  } catch (error) { next(error); }
});

export default router;
