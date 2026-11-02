import express from 'express';
import mongoose from 'mongoose';
import authroute from "./routes/auth.js"
import marketroute from "./routes/market.js"
import orderroute from "./routes/order.js"
import "dotenv/config";

await mongoose.connect(process.env.MONGO_URL)
   .then(()=>{console.log("MongoDB connected")})
   .catch((error)=>{console.log("Connection failed",error)})

const app = express();
app.use(express.json());

// CONTROLLERS :
app.use("/", authroute);
app.use("/", marketroute)
app.use("/", orderroute)

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server listening on Port ${PORT}`);
})