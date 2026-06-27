const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoute = require('./src/chatRoute');
const evaluateRoute = require('./src/evaluateRoute');
const uploadRoute = require('./src/uploadRoute');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.use('/api', chatRoute);
app.use('/api', evaluateRoute);
app.use('/api', uploadRoute);

const clientDist = path.resolve(__dirname, '..', 'client', 'dist');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  return res.sendFile(path.join(clientDist, 'index.html'), err => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`ReqSense server running on http://localhost:${PORT}`);
});
