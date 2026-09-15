import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import Admin from "./models/Admin.js";
import Product from "./models/Product.js";
import Settings from "./models/Settings.js";
import { validEmail } from "./utils/validate.js";

if (!validEmail(config.seedAdminEmail) || config.seedAdminPassword.length < 12)
  throw new Error("ADMIN_EMAIL এবং কমপক্ষে ১২ অক্ষরের ADMIN_PASSWORD দিন।");
if (!validEmail(config.storeEmail)) throw new Error("একটি বৈধ STORE_EMAIL দিন।");

const products = [
  {name:"ডার্ক এলিক্সার",slug:"dark-elixir",category:"মিক্স",weight:"৪০০ গ্রাম",price:890,description:"মধু, খেজুর, বাদাম, কালোজিরা ও নানা সিডের সমৃদ্ধ মিশ্রণ।",image:"/assets/dark-elixir.webp",stock:20,featured:true},
  {name:"খাঁটি ফুলের মধু",slug:"pure-honey",category:"মধু",weight:"৫০০ গ্রাম",price:650,description:"প্রাকৃতিক স্বাদ ও সুবাসে ভরপুর বাছাই করা ফুলের মধু।",image:"/assets/honey.webp",stock:16,featured:true},
  {name:"প্রিমিয়াম খেজুর",slug:"premium-dates",category:"খেজুর",weight:"৫০০ গ্রাম",price:540,description:"নরম, মিষ্টি ও যত্নে বাছাই করা মানসম্মত খেজুর।",image:"/assets/nuts-dates.webp",stock:18,featured:true},
  {name:"মিক্সড নাটস",slug:"mixed-nuts",category:"বাদাম",weight:"২৫০ গ্রাম",price:590,description:"কাজু, কাঠবাদাম ও আখরোটের মচমচে প্রিমিয়াম মিশ্রণ।",image:"/assets/nuts-dates.webp",stock:12},
  {name:"কালোজিরা মধু",slug:"black-seed-honey",category:"মধু",weight:"২৫০ গ্রাম",price:430,description:"মধুর সঙ্গে বাছাই করা কালোজিরার অনন্য স্বাদের মিশ্রণ।",image:"/assets/honey.webp",stock:14},
  {name:"সুপার সিড মিক্স",slug:"seed-mix",category:"সিড",weight:"২০০ গ্রাম",price:380,description:"কুমড়া, সূর্যমুখী ও অন্যান্য বাছাই করা সিডের মিশ্রণ।",image:"/assets/nuts-dates.webp",stock:10},
];

await mongoose.connect(config.mongoUri);
try {
  const passwordHash = await bcrypt.hash(config.seedAdminPassword, 12);
  const adminResult = await Admin.updateOne(
    { email: config.seedAdminEmail },
    { $setOnInsert: { email: config.seedAdminEmail, passwordHash, active: true, tokenVersion: 0 } },
    { upsert: true, runValidators: true },
  );
  await Product.bulkWrite(products.map((product) => ({ updateOne: { filter: { slug: product.slug }, update: { $set: product }, upsert: true } })));
  await Settings.findOneAndUpdate(
    { key: "store" },
    { $set: { email: config.storeEmail, phone: "01310105529", whatsapp: "8801310105529", address: "বনশ্রী, ঢাকা", deliveryDhaka: 80, deliveryOutside: 140 } },
    { upsert: true, runValidators: true },
  );
  console.log(adminResult.upsertedCount ? "Seed complete: initial admin created with bcrypt password hash" : "Seed complete: initial admin already exists; password was not changed");
} finally {
  await mongoose.disconnect();
}
