const roundPrice=value=>Math.max(0,Math.round(value));

export function discountStatus(product,now=new Date()){
  const discount=product?.discount;
  if(!discount?.enabled)return"none";
  if(discount.startAt&&new Date(discount.startAt)>now)return"scheduled";
  if(discount.endAt&&new Date(discount.endAt)<=now)return"expired";
  if(discount.quantityLimit!=null&&discount.quantityUsed>=discount.quantityLimit)return"sold_out";
  return"active";
}

export function priceFor(product,now=new Date()){
  const originalPrice=Number(product.price),status=discountStatus(product,now);
  if(status!=="active")return{originalPrice,currentPrice:originalPrice,savings:0,discountStatus:status,activeDiscount:null};
  const discount=product.discount,value=Number(discount.value);
  const currentPrice=discount.type==="percentage"?roundPrice(originalPrice-originalPrice*value/100):roundPrice(originalPrice-value);
  return{originalPrice,currentPrice,savings:originalPrice-currentPrice,discountStatus:status,activeDiscount:{type:discount.type,value,quantityRemaining:discount.quantityLimit==null?null:Math.max(0,discount.quantityLimit-discount.quantityUsed),endAt:discount.endAt||null}};
}

export function publicProduct(product,now=new Date()){
  const raw=typeof product.toObject==="function"?product.toObject():product,{discount,...safe}=raw;
  return{...safe,...priceFor(raw,now)};
}

export function adminProduct(product,now=new Date()){
  const raw=typeof product.toObject==="function"?product.toObject():product;
  return{...raw,...priceFor(raw,now)};
}

export function activeDiscountQuery(product,quantity,now=new Date()){
  const query:any={_id:product._id,active:true,stock:{$gte:quantity},"discount.enabled":true,$and:[{$or:[{"discount.startAt":null},{"discount.startAt":{$lte:now}}]},{$or:[{"discount.endAt":null},{"discount.endAt":{$gt:now}}]}]};
  if(product.discount.quantityLimit!=null)query.$expr={$lte:[{$add:[{$ifNull:["$discount.quantityUsed",0]},quantity]},"$discount.quantityLimit"]};
  return query;
}
