import express from 'express';
import { order } from '../controllers/order.js';
import { authmiddleware } from '../middleware/authmiddleware.js';
import { validate } from "../middleware/validate.js"
import { orderZschema } from '../types/order.js';
const route = express.Router();

route.post("/order", authmiddleware, validate(orderZschema), order );

export default route;