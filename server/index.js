require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT ?? 3001;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
