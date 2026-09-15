export const clean=(value,max=200)=>typeof value==="string"?value.trim().slice(0,max):"";
export const validPhone=value=>/^01[3-9]\d{8}$/.test(value);
export const validEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=120;
export const validObjectId=value=>/^[a-f\d]{24}$/i.test(value);
export const validImage=value=>/^\/(?:assets|uploads)\/[a-z0-9._-]+$/i.test(value)||/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(value);
export const validMobilePaymentDetails=(senderNumber,transactionId)=>validPhone(senderNumber)&&/^[A-Z0-9-]{6,24}$/.test(transactionId);

export function productInput(body){
  const price=Number(body.price),source=body.discount||{},enabled=Boolean(source.enabled),startAt=source.startAt?new Date(source.startAt):null,endAt=source.endAt?new Date(source.endAt):null,quantityLimit=source.quantityLimit==null||source.quantityLimit===""?null:Number(source.quantityLimit),quantityUsed=Number.isInteger(Number(source.quantityUsed))?Math.max(0,Number(source.quantityUsed)):0;
  const discount={enabled,type:source.type==="fixed"?"fixed":"percentage",value:enabled?Number(source.value):0,startAt,endAt,quantityLimit,quantityUsed};
  const data={name:clean(body.name,100),slug:clean(body.slug,100).toLowerCase(),category:clean(body.category,50),weight:clean(body.weight,40),price,stock:Number(body.stock),description:clean(body.description,600),image:clean(body.image,500),discount,featured:Boolean(body.featured),active:body.active!==false};
  if(data.name.length<2||!/^[a-z0-9-]+$/.test(data.slug)||!data.category||!data.weight||!Number.isFinite(data.price)||data.price<0||!Number.isInteger(data.stock)||data.stock<0||data.description.length<5||!validImage(data.image))throw Object.assign(new Error("পণ্যের তথ্য সঠিকভাবে দিন।"),{status:422});
  if(enabled&&(!Number.isFinite(discount.value)||discount.value<=0||discount.type==="percentage"&&discount.value>100||discount.type==="fixed"&&discount.value>price||startAt&&Number.isNaN(startAt.getTime())||endAt&&Number.isNaN(endAt.getTime())||startAt&&endAt&&endAt<=startAt||quantityLimit!=null&&(!Number.isInteger(quantityLimit)||quantityLimit<1)||quantityLimit!=null&&quantityUsed>quantityLimit))throw Object.assign(new Error("Discount-এর তথ্য সঠিকভাবে দিন।"),{status:422});
  return data;
}
