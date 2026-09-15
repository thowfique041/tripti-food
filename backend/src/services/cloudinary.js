import{v2 as cloudinary}from"cloudinary";
import{config}from"../config.js";

export function cloudinaryReady(){return Boolean(config.cloudinaryCloudName&&config.cloudinaryApiKey&&config.cloudinaryApiSecret)}

export function uploadProductImage(buffer){
  if(!cloudinaryReady())throw Object.assign(new Error("Cloudinary configuration এখনো সম্পন্ন হয়নি।"),{status:503});
  cloudinary.config({cloud_name:config.cloudinaryCloudName,api_key:config.cloudinaryApiKey,api_secret:config.cloudinaryApiSecret,secure:true});
  return new Promise((resolve,reject)=>{
    const stream=cloudinary.uploader.upload_stream({folder:"tripti-food/products",resource_type:"image",use_filename:true,unique_filename:true,overwrite:false,transformation:[{width:1400,height:1400,crop:"limit",quality:"auto",fetch_format:"auto"}]},(error,result)=>error?reject(error):resolve(result));
    stream.end(buffer);
  });
}
