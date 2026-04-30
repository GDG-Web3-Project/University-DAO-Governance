import express from 'express';
import ClassModel from '../models/Class.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const classes = await ClassModel.find().select('name slug description isPublic');
  res.json({ classes });
});

export default router;
