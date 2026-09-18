import{Router}from"express";
import Product from"../models/Product.js";
import{requireAdmin}from"../middleware/auth.js";
import{adminProduct}from"../utils/discount.js";

const router=Router();
router.use(requireAdmin);
router.get("/",async(req,res,next)=>{try{const now=new Date(),products=await Product.find().sort({createdAt:-1}).lean();res.json({products:products.map(product=>adminProduct(product,now))})}catch(e){next(e)}});
export default router;
