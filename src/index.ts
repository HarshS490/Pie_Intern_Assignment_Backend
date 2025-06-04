// src/index.ts
import express from 'express';
import { configDotenv } from 'dotenv';
import router from './routes/route.js';

configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(router);


app.listen(PORT, () => {
  console.log('Server listening on port:', PORT);
});
