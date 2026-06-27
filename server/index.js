require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoute = require('./src/chatRoute');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api', chatRoute);

app.listen(PORT, () => {
  console.log(`ReqSense server running on http://localhost:${PORT}`);
});
