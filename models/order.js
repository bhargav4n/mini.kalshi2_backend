import mongoose from "mongoose";
// Orderbook Db : 
// Market
//   ├── YES Orderbook
//   │    ├── Bids
//   │    └── Asks
//   │
//   └── NO Orderbook
//        ├── Bids
//        └── Asks
// { "marketId": "MARKET_ID", "type": "buy", "side": "YES", "price": 80, "qty": 5}
const orderSchema = mongoose.Schema({
    userId : {type: mongoose.Schema.Types.ObjectId, ref : "user", required: true},
    price : {type: Number, default : 0},
    qty : {type : Number, default : 0}
},{ timestamps : true }
)
const orderbookScheama = mongoose.Schema({
    marketId : {type : mongoose.Schema.Types.ObjectId, ref : "market", required : true, unique : true },
    yes : 
    {
        bids : { type : [orderSchema], default : [] },
        asks : { type : [orderSchema], default : [] }
    },
    no : 
    {
        bids : { type : [orderSchema], default : [] },
        asks : { type : [orderSchema], default : [] }
    }
})

export const orderbookmodel = mongoose.model("orderbook", orderbookScheama);