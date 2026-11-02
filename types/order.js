import z from 'zod';

export const orderZschema = z.object({
    marketId : z.string(),
    type : z.enum(["buy", "sell"]),
    side : z.enum(["yes","no"]),
    price : z.number().int().min(1).max(99),
    qty : z.number().int().min(1)
})