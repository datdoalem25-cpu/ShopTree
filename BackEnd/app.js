const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const productRoutes = require('./routes/productRoutes');
const consumerRoutes = require('./routes/consumerRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const allowedOrigins = [
	process.env.FRONTEND_ORIGIN,
	process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

// ==========================================
//              MIDDLEWARE
// ==========================================
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.length === 0) return callback(null, true);
			if (allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error('Origin không được phép bởi CORS.'));
		},
	})
);
app.use(express.json());

// Serve static files (ảnh sản phẩm, QR code)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'ok' });
});

// ==========================================
//              ROUTES
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farmer', farmerRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/consume', consumerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', require('./routes/userRoutes'));

module.exports = app;
