import{Router}from"express";
import multer from"multer";
import{requireAdmin}from"../middleware/auth.js";
import{uploadProductImage}from"../services/cloudinary.js";

const router=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1},fileFilter(req,file,cb){const allowed=new Set(["image/jpeg","image/png","image/webp","image/avif"]);if(!allowed.has(file.mimetype))return cb(Object.assign(new Error("শুধু JPG, PNG, WebP অথবা AVIF ছবি দিন।"),{status:422}));cb(null,true)}});

router.use(requireAdmin);
router.post("/images",upload.single("image"),async(req,res,next)=>{try{if(!req.file)throw Object.assign(new Error("একটি ছবি নির্বাচন করুন।"),{status:422});const result=await uploadProductImage(req.file.buffer);res.status(201).json({image:{url:result.secure_url,publicId:result.public_id,width:result.width,height:result.height}})}catch(e){next(e)}});

export default router;
