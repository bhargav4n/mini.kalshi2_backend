import z from 'zod';

export const marketZshema = z.object({
    title : z.string().trim()
})