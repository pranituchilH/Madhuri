# Madhuri Sarees — E-commerce Store

Full-stack saree store with customer storefront, admin panel and Razorpay payments.

| Part | Tech | Folder | URL (dev) |
|------|------|--------|-----------|
| Storefront + Admin | Next.js 15 (App Router), React 19, Tailwind CSS | `frontend/` | http://localhost:3000 (admin at `/admin`) |
| API | Node.js, Express, JWT, Multer, Razorpay SDK | `backend/` | http://localhost:5050/api |
| Database | MySQL 8+ | — | `madhuri_sarees` |

## 1. Setup

```bash
# MySQL (macOS / Homebrew)
brew install mysql && brew services start mysql
mysql -uroot -e "CREATE USER 'madhuri'@'localhost' IDENTIFIED BY 'your_password'; GRANT ALL ON madhuri_sarees.* TO 'madhuri'@'localhost';"

# Backend
cd backend
cp .env.example .env          # set DB_PASSWORD, JWT_SECRET, Razorpay keys
npm install
npm run db:seed               # creates tables + admin user + demo catalogue (DROPS existing tables!)
npm run dev                   # http://localhost:5050

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

Default admin login: **admin@madhurisarees.com / Admin@123** (set in `backend/.env` before seeding — change it for production).

> Port 5000 is used by macOS AirPlay, so the API runs on **5050**.

## 2. Razorpay

1. Create keys at https://dashboard.razorpay.com/app/keys (use **Test mode** first).
2. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env` and restart the API.
3. (Recommended) Add a webhook → URL `https://<your-api-domain>/api/payments/webhook`, events `payment.captured` and `order.paid`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. This confirms payments even if the customer closes the browser before returning.

Flow: checkout creates the order in MySQL → API creates a Razorpay order → Razorpay Checkout opens → API verifies the HMAC signature → order is marked **paid/confirmed** and stock is reduced. Unpaid orders can be retried from the customer's order page. Until keys are added, only Cash on Delivery is offered.

## 3. Features

**Storefront:** hero carousel, collections, bestsellers, new arrivals, offers banner, shop with filters (collection, colour, price, stock) + sort + search, product page with gallery zoom, details, reviews & related sarees, wishlist, cart drawer, coupons, checkout (saved addresses, Razorpay / COD), order tracking & cancellation, account (orders, wishlist, addresses, profile, password), about, contact form, policies, newsletter, WhatsApp button, SEO metadata, sitemap & robots.

**Admin panel (`/admin`):** dashboard (revenue, 30-day chart, order status, top products, low stock), orders (filters, status/payment/tracking updates, printable invoice), products (CRUD, multi-image upload & ordering, featured/new/active), categories, customers (block/unblock), coupons, review moderation, contact messages, newsletter subscribers (CSV export).

## 4. Images

- `images/` — original photos supplied.
- `tools/make_images.py` regenerates all web images (needs `pip install pillow`):
  - product photos → `backend/uploads/products/`
  - brand artwork (hero banners, collection tiles, promo, story, Instagram grid, transparent logo, favicon, social share image) → `frontend/public/brand/`
- Images uploaded from the admin panel are saved in `backend/uploads/products/`.

## 5. Before going live

- Replace placeholder prices/stock (admin → Products), contact details in `frontend/lib/site.js`, social links in `frontend/components/store/SocialIcons.jsx`, and review the policy text in `frontend/app/(store)/policy/[slug]/page.jsx`.
- Use a strong `JWT_SECRET`, a new admin password, live Razorpay keys, and HTTPS.
- Set `CLIENT_URL` (backend) and `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` (frontend) to your real domains.
- Build: `cd frontend && npm run build && npm start`; run the API with `npm start` under a process manager (e.g. pm2).
