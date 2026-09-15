# তৃপ্তি ফুড

Frontend ও Cloudflare Worker/D1 backend আলাদা রাখা একটি mobile-first food commerce MVP।

## Folder

- `frontend/` — storefront, cart, checkout ও admin UI
- `backend/` — API, validation, order database ও admin authentication

## Local run

1. `backend/`-এ `npm install`
2. `npx wrangler d1 execute tripti-food --local --file=schema.sql`
3. `npx wrangler d1 execute tripti-food --local --file=seed.sql`
4. শক্তিশালী admin secret সেট করুন: `npx wrangler secret put ADMIN_TOKEN`
5. `npm run dev`
6. আলাদা terminal-এ `frontend/` থেকে static server চালান, যেমন `python3 -m http.server 8000`

## Production checklist

1. Cloudflare D1 database তৈরি করে `backend/wrangler.jsonc`-তে database ID বসান।
2. Remote database-এ `schema.sql` ও `seed.sql` apply করুন।
3. `ADMIN_TOKEN` secret এবং সঠিক `ALLOWED_ORIGINS` দিন।
4. Backend deploy করে তার URL `frontend/config.js`-এর `apiBase`-এ দিন।
5. Frontend Cloudflare Pages-এ deploy করে custom domain connect করুন।

## Demo values

Product, price ও delivery charge demo। ফোন/WhatsApp: `01310105529`। Frontend contact `frontend/config.js`; backend delivery fee `backend/src/worker.js`-এ আছে—production admin settings যোগ করার আগে দুই জায়গায় একই মান রাখুন।
