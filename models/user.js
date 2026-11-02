import mongoose from "mongoose";

// Create a Schema and Model object
const userSchema = new mongoose.Schema({
    username : 
    {
        type : String,
        required : true,
        trim : true,
        unique : true
    },
    password : 
    {
        type : String,
        trim : true
    },  
    balance: {
        type: Number,
        default: 0,
    },
    locked_balance:
    {
        type : Number,
        default : 0
    },
});

const stockbalanceSchema = new mongoose.Schema({
    userId:
    {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : true
    },
    marketId:
    {
        type : mongoose.Schema.Types.ObjectId,
        ref : "market",
        required : true
    },
    side:
    {
        type : String,
        enum : ["yes","mo"],
        required : true
    },
    qty:
    {
        type : Number,
        required : true
    },
    locked_qty:
    {
        type : Number,
        required : true
    }
})

export const usermodel = mongoose.model("user",userSchema);
export const Stockbalancemodel = mongoose.model("stockbalance",stockbalanceSchema);