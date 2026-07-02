import {email, z} from 'zod'

export const registerSchema=z.object({
    email: z.string().email("Pls provide a valid email address"),
    name: z.string().min(2,"Name must be atleast 2 charecters long"),
    password: z.string().min(8,"Passworkmust be atleast 8 charectors long.")
});

export const loginSchema=z.object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8,"Password is required.")
})