import { prisma } from "../config/db.js"

export const checkUser= async (req,res)=>{
    try {
        const {email}=req.query;

        if (!email) return res.status(400).json({ message: "Email is required" });

        const user= await prisma.user.findUnique({where: {email},select:{id:true,name:true}});

        if(user){
            res.status(200).json({ exists: true, name: user.name });
        }else{
            res.status(404).json({ exists: false })
        }
    } catch (error) {
        res.status(400).json({message:"Internal server error",error})
    }
};