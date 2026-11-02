import z from 'zod';

export const userZschema = z.object({
    username : z.string().trim().min(3),
    password : z.string().trim().min(10)
});

export const onrampZschema = z.object({
    amount : z.number().int().positive()
})