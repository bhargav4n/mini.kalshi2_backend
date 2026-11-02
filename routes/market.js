import express from 'express';
import { market } from '../controllers/market.js';
import { authmiddleware } from '../middleware/authmiddleware.js';
import { validate } from "../middleware/validate.js"
import { marketZshema } from '../types/market.js';
const route = express.Router();

route.post("/market", authmiddleware, validate(marketZshema), market);

export default route;