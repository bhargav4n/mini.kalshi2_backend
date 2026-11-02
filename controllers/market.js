import { marketmodel } from "../models/market.js";
import { orderbookmodel } from "../models/order.js";

// 4. POST market : 
export const market = async(req,res) =>
{
    try
    {
        const user = req.user;
        const title = req.body.title;

        // Check if the market is not empty or missing
        if(!title || title.trim()=="")
            return res.status(400).json({message:"Missing field or Empty field"});

        // Check if the market already exists
        const exitsmarket = await marketmodel.findOne({title : title});
        if(exitsmarket)
            return res.status(400).json({message:"Market already exits"});

        // Create a New market
        const newmarket = await marketmodel.create({
            creatorId : user._id,
            title : title,
            resolution : "no"
        })

        // Create an Order book for the market
        const neworderbook = await orderbookmodel.create({marketId : newmarket._id});

        res.status(200).json({
            marketId : newmarket._id,
            orderbookId : neworderbook._id
        })
    }
    catch(error)
    {
        console.log(error.message);
        return res.status(500).json({message: "Database operation fails"});
    }
}