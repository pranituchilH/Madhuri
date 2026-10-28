import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/db.js';
import { migrate } from './db/migrate.js';
import { errorHandler, notFound } from './middleware/error.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { asyncHandler } from './utils/http.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import accountRoutes from './routes/account.js';
import orderRoutes from './routes/orders.js';
import miscRoutes, { razorpayWebhook } from './routes/misc.js';
import shippingRoutes from './routes/shipping.js';
import adminRoutes from './routes/admin/index.js';

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((s) => s.trim());

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: origins, credentials: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Webhook needs the raw body for signature verification, so it is mounted before express.json().
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), asyncHandler(razorpayWebhook));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', catalogRoutes);
app.use('/api', orderRoutes);
app.use('/api', miscRoutes);
app.use('/api/shipping', shippingRoutes);

app.use(notFound);
app.use(errorHandler);

try {
  await migrate();
} catch (err) {
  console.error(`Database migration failed: ${err.message}`);
}

const port = Number(process.env.PORT || 5050);
app.listen(port, () => console.log(`Madhuri Sarees API running on http://localhost:${port}`));
