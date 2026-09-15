const JSON_HEADERS={"Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Permissions-Policy":"camera=(), microphone=(), geolocation=()","Cache-Control":"no-store"};
const buckets=new Map();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...extra}});
function cors(request,env){const origin=request.headers.get("Origin")||"";const allowed=(env.ALLOWED_ORIGINS||"").split(",").map(x=>x.trim()).filter(Boolean);return allowed.includes(origin)?{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Vary":"Origin"}:{} }
function limited(request,limit=15){const key=request.headers.get("CF-Connecting-IP")||"local";const now=Date.now(),entry=buckets.get(key)||{start:now,count:0};if(now-entry.start>60000){entry.start=now;entry.count=0}entry.count++;buckets.set(key,entry);return entry.count>limit}
function text(v,min,max){return typeof v==="string"?v.trim().slice(0,max):""}
function validPhone(v){return /^01[3-9]\d{8}$/.test(v)}
async function secureEqual(a,b){if(!a||!b)return false;const enc=new TextEncoder(),[ha,hb]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(a)),crypto.subtle.digest("SHA-256",enc.encode(b))]);return [...new Uint8Array(ha)].every((v,i)=>v===new Uint8Array(hb)[i])}
async function isAdmin(req,env){const h=req.headers.get("Authorization")||"";return secureEqual(h.startsWith("Bearer ")?h.slice(7):"",env.ADMIN_TOKEN)}
async function products(env){const result=await env.DB.prepare("SELECT id,slug,name,category,weight,price,description,image,stock FROM products WHERE active=1 ORDER BY id").all();return result.results}
async function createOrder(req,env){if(limited(req))return json({error:"অনুগ্রহ করে এক মিনিট পর চেষ্টা করুন।"},429);let body;try{body=await req.json()}catch{return json({error:"সঠিক তথ্য পাঠান।"},400)}const c=body.customer||{},name=text(c.name,2,80),phone=text(c.phone,11,11),address=text(c.address,8,300),area=["dhaka","outside"].includes(c.area)?c.area:"",payment=["cod","bkash","nagad"].includes(body.payment)?body.payment:"";if(name.length<2||!validPhone(phone)||address.length<8||!area||!payment)return json({error:"নাম, ফোন, ঠিকানা ও পেমেন্ট সঠিকভাবে দিন।"},422);if(!Array.isArray(body.items)||body.items.length<1||body.items.length>20)return json({error:"কার্টের তথ্য সঠিক নয়।"},422);const requested=new Map();for(const i of body.items){const id=Number(i.productId),qty=Number(i.quantity);if(!Number.isInteger(id)||!Number.isInteger(qty)||qty<1||qty>20)return json({error:"পণ্যের পরিমাণ সঠিক নয়।"},422);requested.set(id,(requested.get(id)||0)+qty)}const ids=[...requested.keys()],marks=ids.map(()=>"?").join(",");const found=await env.DB.prepare(`SELECT id,name,price,stock FROM products WHERE active=1 AND id IN (${marks})`).bind(...ids).all();if(found.results.length!==ids.length)return json({error:"একটি পণ্য পাওয়া যায়নি।"},409);let subtotal=0;for(const p of found.results){const q=requested.get(p.id);if(q>p.stock)return json({error:`${p.name} পর্যাপ্ত স্টকে নেই।`},409);subtotal+=p.price*q}const fee=area==="dhaka"?80:140,total=subtotal+fee,id=`TF-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;const statements=[env.DB.prepare("INSERT INTO orders(id,customer_name,customer_phone,customer_address,area,payment_method,subtotal,delivery_fee,total) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,name,phone,address,area,payment,subtotal,fee,total)];for(const p of found.results){const q=requested.get(p.id);statements.push(env.DB.prepare("INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,line_total) VALUES(?,?,?,?,?,?)").bind(id,p.id,p.name,p.price,q,p.price*q));statements.push(env.DB.prepare("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?").bind(q,p.id,q))}await env.DB.batch(statements);return json({ok:true,orderId:id,total})}
export default{async fetch(request,env){
 const url=new URL(request.url),headers=cors(request,env);if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 try{let response;
  if(url.pathname==="/api/health"&&request.method==="GET")response=json({ok:true});
  else if(url.pathname==="/api/products"&&request.method==="GET")response=json({products:await products(env)},200,{"Cache-Control":"public, max-age=120"});
  else if(url.pathname==="/api/orders"&&request.method==="POST")response=await createOrder(request,env);
  else if(url.pathname==="/api/admin/orders"&&request.method==="GET"){
   if(!(await isAdmin(request,env)))response=json({error:"অনুমতি নেই।"},401,{"WWW-Authenticate":"Bearer"});
   else{const r=await env.DB.prepare("SELECT id,customer_name,customer_phone,total,payment_method,status,created_at FROM orders ORDER BY created_at DESC LIMIT 100").all();response=json({orders:r.results})}
  }else if(/^\/api\/admin\/products\/\d+$/.test(url.pathname)&&request.method==="PUT"){
   if(!(await isAdmin(request,env)))response=json({error:"অনুমতি নেই।"},401);
   else{const id=Number(url.pathname.split("/").pop());let body;try{body=await request.json()}catch{body={}}const name=text(body.name,2,100),price=Number(body.price),stock=Number(body.stock);
    if(name.length<2||!Number.isInteger(price)||price<0||price>1000000||!Number.isInteger(stock)||stock<0||stock>100000)response=json({error:"নাম, মূল্য বা stock সঠিক নয়।"},422);
    else{const result=await env.DB.prepare("UPDATE products SET name=?,price=?,stock=? WHERE id=?").bind(name,price,stock,id).run();response=result.meta.changes?json({ok:true}):json({error:"পণ্য পাওয়া যায়নি।"},404)}
   }
  }else response=json({error:"পাওয়া যায়নি।"},404);
  const out=new Response(response.body,response);Object.entries(headers).forEach(([k,v])=>out.headers.set(k,v));return out;
 }catch(err){console.error("request_failed",err?.message);return json({error:"সার্ভারে সাময়িক সমস্যা হয়েছে।"},500,headers)}
}};
export {validPhone,text};
