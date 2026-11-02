import jwt from 'jsonwebtoken';
import { usermodel } from "../models/user.js";

export const authmiddleware = async(req,res,next)=>
{
    const token = req.headers.token;

    // decode the token using JWT
    let decode;
    let existuser;
    try
    {
        decode = jwt.verify(token, process.env.JWT_KEY);
        existuser = await usermodel.findOne({_id:decode.userid}); // returns the user if token is matched

        // check if the user exits or not
        if(!existuser)
        {
            res.status(404).json({message:"User doesnt exists"});
            return;
        }
    }
    catch(error)
    {
        res.status(409).json({message :"Invalid token"});
        return;
    }

    // if everything is passed ie the token is correct and the user is present -> add the user in the req object
    req.user = existuser; // user document added
    next();
}