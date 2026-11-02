import jwt from 'jsonwebtoken';
import { usermodel } from "../models/user.js";
import bcrypt from 'bcrypt'

// 1. POST signup
export const signup = async (req, res )=>{
    const username = req.body.username;
    const password = req.body.password;

    // check if the username is present in DB 
    // hash the password
    // add the user to the DB

    const existUser = await usermodel.findOne({username : username});

    // if user exists -> then return 400 and tell user exists

    if(existUser)
    {
        res.status(400).json({message:"User exists"});
        return;
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const newUser = await usermodel.create({
        username : username,
        password : hashpassword
    })

    res.status(200).json({UserID : newUser._id});
}

// 2. POST signin
export const signin = async(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    // check if the username and passowrd exists in the DB 
    const existUser = await usermodel.findOne({username : username});

    if(!existUser)
    {
        res.status(400).json({message:"User exits"});
        return;
    }

    // check if the password matches or not
    const passbool = await bcrypt.compare(existUser.password, password);
    if(passbool)
    {
        res.status(400).json({message:"Invalid credentials"});
        return;
    }

    const token = jwt.sign({userid : existUser._id}, process.env.JWT_KEY);

    res.status(200).json({token : token});    
}


// 3. POST onramp
// on ramp method : 
// authmiddlware adds the username doc in the req object - use it
export const onramp = async(req,res)=>
{
    const amount = req.body.amount; // has the amount to be added 
    const user = req.user; // has the uer details

    let user_balance = user.balance;
    user_balance = user_balance + amount

    await usermodel.updateOne({_id : user._id},{balance : user_balance})
    
    const updatedUser = await usermodel.findOne({ _id: user._id });

    res.status(200).json({balance: updatedUser.balance});
}