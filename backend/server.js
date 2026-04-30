import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import inviteRoutes from './routes/invite.js';
import proposalRoutes from './routes/proposals.js';
import classRoutes from './routes/classes.js';
import classElectionRoutes from './routes/classElections.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/class-elections', classElectionRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'university-dao-backend', version: '0.1.0' });
});

const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university-dao';

mongoose
  .connect(connectionString)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
      console.log(`University DAO API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });
