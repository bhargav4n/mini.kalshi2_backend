import z from "zod";
export const validate = (schema) => (req,res, next)=>
{
    const response = schema.safeParse(req.body);
    // check if the Schema satisfies
    if(!response.success)
        return res.status(404).json({message:"Invalid Schema"});
    next();
}