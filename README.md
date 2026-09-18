# তৃপ্তি ফুড — MERN + TypeScript

মোবাইল-ফার্স্ট বাংলা e-commerce website। React storefront এবং Node/Express/MongoDB backend সম্পূর্ণ TypeScript-এ, আলাদা folder-এ রাখা হয়েছে।

## Structure

- `frontend/` — React + TypeScript + Vite storefront, cart, checkout ও admin dashboard
- `backend/` — TypeScript + Express REST API, MongoDB models, JWT admin authentication ও tests

## Features

- Responsive catalogue, category filter, cart ও checkout
- COD, bKash, Nagad এবং WhatsApp fallback
- Server-side price, delivery fee ও stock validation
- Admin login, product CRUD, store settings ও order status
- Admin account database-এ থাকে এবং password শুধু bcrypt hash হিসেবে সংরক্ষিত হয়
- Helmet security headers, strict CORS, request limits ও rate limits
- Environment-only secrets; no credentials in source

## Local setup

Node.js 20+ এবং local MongoDB প্রয়োজন।

দুই folder-এই `npm run typecheck` দিয়ে TypeScript validation এবং `npm test` দিয়ে automated tests চালানো যায়।

### Backend

```bash
cd backend
cp .env.example .env
# .env-এ শক্তিশালী JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD ও STORE_EMAIL দিন
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Website: `http://localhost:5173`
Admin: `http://localhost:5173/admin`

## Production

- Frontend: Cloudflare Pages বা Vercel (`npm run build`, output `dist`)
- Backend: Render/Railway/Node-compatible host (`npm start`)
- Database: MongoDB Atlas
- Runtime-এ `FRONTEND_URL`, `MONGODB_URI` ও `JWT_SECRET` configure করুন। প্রথম admin তৈরি বা password reset করতে seed চালানোর সময় `ADMIN_EMAIL`, `ADMIN_PASSWORD` ও `STORE_EMAIL` দিন।
