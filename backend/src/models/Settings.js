import mongoose from"mongoose";
const schema=new mongoose.Schema({key:{type:String,unique:true,default:"store"},email:{type:String,required:true,lowercase:true,trim:true,maxlength:120,match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/},phone:{type:String,required:true,match:/^01[3-9]\d{8}$/},whatsapp:{type:String,required:true,match:/^8801[3-9]\d{8}$/},address:{type:String,required:true,trim:true,maxlength:200},deliveryDhaka:{type:Number,required:true,min:0,max:5000},deliveryOutside:{type:Number,required:true,min:0,max:5000}},{timestamps:true});
export default mongoose.model("Settings",schema);
