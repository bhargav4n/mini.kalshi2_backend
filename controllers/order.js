import { marketmodel } from "../models/market.js";
import { orderbookmodel } from "../models/order.js";
import { usermodel, Stockbalancemodel} from "../models/user.js";

// 5. POST order : 
// { "marketId": "MARKET_ID", "type": "buy", "side": "YES", "price": 80, "qty": 5}
export const order = async(req,res)=>
{
    // Check if the market exists or not : 
    // Check if the market is unresolved : 
    // Check that the buyer has enough available USD : 
    // Lock price × qty cents :
    try
    {
        const user = req.user;
        const {marketId,type,side,price,qty} = req.body;
        const market = await marketmodel.findOne({_id : marketId});
        const order = await orderbookmodel.findOne({marketId});
        
        // Check if the market exists or not : 
        if(!market)
        return res.status(400).json({message:"Market Id not found"});

        // Check if the market is unresolved : 
        if(market.resolution==="yes")
            return res.status(400).json({message:"Market is resolved"});

        // Check if the user wants to buy the YES or NO token
        if(type==="buy")
        {
            // Check if the user has enough USD dollars in how account
            if(user.balance < price*qty)
                return res.status(400).json({message:"Insufficient funds to place an order"});

            // Lock price × qty cents and update the balance
            await usermodel.updateOne(
                {_id : user._id},
                {$inc : {balance : -(price*qty), locked_balance : qty*price}}
            );

            // Check if someone is matching in the order book with the user         
            const asks = order[side].asks
                .filter(a => a.price <= price)
                .sort((a, b) => a.price - b.price || a.createdAt - b.createdAt);

            let remaining_qty = qty;
            for(const ask of asks)
            {
                if(remaining_qty==0) break;
                // 1. Reduce the ask (or remove it if fully filled)
                // 2. Pay the seller
                // 3. Give tokens to the buyer
                // 4. Refund the buyer's extra money

                // the remaining quantity and the ask quantity is the same
                if(remaining_qty>ask.qty)
                {
                    await orderbookmodel.updateOne
                    (
                        { marketId },
                        { $pull: { [`${side}.asks`]: { _id: ask._id } } }
                    )
                    remaining_qty = remaining_qty - ask.qty;
                    // Pay the seller : ask.qty * ask.price -> 650 cents
                    await usermodel.updateOne
                    (
                        { _id : ask.userId},
                        { $inc : { balance : ask.qty * ask.price}}
                    )
                    // add the ask.qty to users stock balance -> 10 Yes token added to the user
                    await Stockbalancemodel.updateOne
                    (
                        { userId : user._id, marketId : market._id, side : side },
                        { $inc : { qty : ask.qty }},
                        { upsert: true } 
                    )
                    //Example with a bid of 70 for 5 tokens and an ask of 65 for 4 tokens:
                        // Locked at order time: 5 × 70 = 350
                        // Seller gets: 4 × 65 = 260
                        // Total deduction is : (70*5)-(65*4) = 90
                        // from the 90 -> 20 goes to the balance and the rest 70 stays in the locked balance
                    let refund = ask.qty*(price - ask.price) // 20
                    let lockedForThis = (price*ask.qty)
                    await usermodel.updateOne
                    (
                        { _id : user._id },
                        { $inc : {balance : refund, locked_balance : -(lockedForThis)}}
                    )
                }
                else if(remaining_qty<ask.qty)
                {
                    await orderbookmodel.updateOne
                    (
                        { marketId, [`${side}.asks._id`]: ask._id },
                        { $inc: { [`${side}.asks.$.qty`]: -remaining_qty } }
                    )
                    // Pay the seller : (remaining_qty) * ask.price
                    await usermodel.updateOne
                    (
                        { _id : ask.userId},
                        { $inc : { balance : remaining_qty * ask.price}}
                    )                    
                    // add remaining_qty to users stock balance   (not ask.qty - remaining_qty)
                    await Stockbalancemodel.updateOne
                    (
                        { userId : user._id, marketId : market._id, side : side },
                        { $inc : { qty : remaining_qty }},
                        { upsert: true } 
                    )
                    //Example with a bid of 70 for 2 tokens and an ask of 65 for 4 tokens:
                        // Locked at order time: 70 x 2 = 140
                        // Seller gets: 65 x 2 = 130
                        // lockedforthis = 140
                        // refund = 10
                    let lockedForThis = price * remaining_qty;
                    let refund = (price * remaining_qty) - (remaining_qty * ask.price );
                    await usermodel.updateOne
                    (
                        { _id : user._id },
                        { $inc : {balance : refund, locked_balance : -(lockedForThis)}}
                    )
                    remaining_qty = 0;            
                }
            } // end of for loop 
            // If remaining_qty > 0, push it to bids as a resting order. Its money must stay locked until it is filled or cancelled.
            if(remaining_qty>0)
            {
                await orderbookmodel.updateOne
                (
                    { marketId : market._id },
                    { $push : { [`${side}.bids`]:
                    { 
                        userId : user._id,
                        price : price,
                        qty : remaining_qty
                    } 
                }}
                )
            }
            return res.status(200).json({message:"Buy order placed successfully"});
        }
        else if (type==="sell") // sell the yes or no tokens
        {
            // const user = req.user;
            // const {marketId,type,side,price,qty} = req.body;
            // const market = await marketmodel.findOne({_id : marketId});
            // const order = await orderbookmodel.findOne({marketId});

            // Check that the seller owns enough unlocked contracts.
            const stockdetails = await Stockbalancemodel.findOne ({ userId: user._id, marketId: market._id, side: side });
            if (!stockdetails || stockdetails.qty < qty)
                return res.status(400).json({message:"Insufficient contracts to sell"});

            // Lock the contracts being offered for sale.
            await Stockbalancemodel.updateOne
            (
                { userId : user._id, marketId : market._id, side : side },
                { $inc : {locked_qty : qty, qty : -qty}}
            )

            // Find BUY orders for the same contract type with prices at or above the SELL limit.
            const bids = order[side].bids
                    .filter(a=>a.price>=price)
                    .sort((a,b)=>b.price - a.price|| a.createdAt - b.createdAt);

            let remaining_qty = qty;
            for(const bid of bids)
            {
                if(remaining_qty==0) break;
                if(remaining_qty>=bid.qty)
                {
                    // Pull the bid from the orderbook
                    await orderbookmodel.updateOne
                    (
                        { marketId : market._id },
                        { $pull : {[`${side}.bids`]:{ _id : bid._id}}}
                    )
                    // Give the stocks to the buyer (bid.userId).
                    await Stockbalancemodel.updateOne
                    (
                        { userId : bid.userId, marketId : market._id, side : side },
                        { $inc : { qty : bid.qty }},
                        { upsert: true }
                    )
                    // Pay the seller (you) bid.qty * bid.price, and reduce your locked stock by bid.qty.
                    await usermodel.updateOne
                    (
                        { _id : user._id },
                        { $inc : { balance : bid.qty * bid.price }}
                    )
                    // and reduce your locked stock by bid.qty.
                    await Stockbalancemodel.updateOne
                    (
                        { userId : user._id, marketId : market._id, side : side },
                        { $inc : { locked_qty : -bid.qty }}
                    )
                    // Reduce the buyer’s locked_balance by bid.qty * bid.price.
                    await usermodel.updateOne
                    (
                        { _id : bid.userId },
                        { $inc : { locked_balance : -(bid.qty*bid.price)}}
                    )
                    remaining_qty = remaining_qty - bid.qty;
                }
                else if(remaining_qty < bid.qty)     
                {
                    // User A wants to sell 2 Yes Token : 60 cents
                    // User B wants to buy 4 Yes token : 80 cents 
                    // User A gets 160 cents
                    // User B gets 2 Yes tokens for 80 cents

                    // Reduce the bid’s qty in the orderbook
                    await orderbookmodel.updateOne
                    (
                        { marketId : market._id, [`${side}.bids._id`] : bid._id },
                        { $inc : {[`${side}.bids.$.qty`]: -(remaining_qty)}}
                    )
                    // Seller : Pay the seller : +(bid.price * remaining_qty)
                    await usermodel.updateOne
                    (
                        { _id : user._id },
                        { $inc : { balance : (bid.price * remaining_qty)}}
                    )
                    // Seller : Deduce the Locked_qty by : -(remaining_qty)
                    await Stockbalancemodel.updateOne
                    (
                        { marketId : market._id, userId : user._id, side : side },
                        { $inc : { locked_qty : -(remaining_qty) }}
                    )
                    // Buyer : Add the stocks : +(remaining_qty)
                    await Stockbalancemodel.updateOne
                    (
                        { marketId : market._id, userId : bid.userId, side : side },
                        { $inc : { qty : (remaining_qty)}},
                        { upsert: true }
                    )
                    // Buyer : Deduce the locked balance : -(bid.price * remaining_qty)
                    await usermodel.updateOne
                    (
                        { _id : bid.userId },
                        { $inc : { locked_balance : -(bid.price * remaining_qty) }}
                    )
                    // remaining_qty = 0
                    remaining_qty = 0;
                }
            } // end of for loop 
            if(remaining_qty > 0)
            {
                await orderbookmodel.updateOne
                (
                { marketId : market._id },
                { $push : {[`${side}.asks`]:{ userId: user._id, price : price, qty : remaining_qty}}}
                )
            }
            return res.status(200).json({message:"Sell order placed successfully"});
        } // end of if 
    } // end of try
    catch(error)
    {
        return res.status(500).json({message:"Internal server error"});
    }
}