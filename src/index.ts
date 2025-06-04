// src/index.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';
import { dummyUser } from './lib/dummyUser';

configDotenv();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.get('/auth', (req, res) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET missing');
    return res.status(500).json({ message: 'Internal Server Error!' });
  }
  const token = jwt.sign(dummyUser, process.env.JWT_SECRET);
  return res.status(200).json({ token });
});

app.listen(PORT, () => {
  console.log('Server listening on port:', PORT);
});
