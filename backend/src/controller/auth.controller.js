
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js'; 
import dotenv from 'dotenv';

dotenv.config();

export const register = async (req, res) => {
  try {
    //destructuring the conent of the json.
    const {email,name,password}=req.body;


    //checking for the exsisting user
    const exsistingUser=await prisma.user.findUnique({where: {email}})//{email}=={email:email}

    if(exsistingUser){
        res.status(400).json({
            "error":"The user With this Eamil already esists"
        })
    }

    //Very important the hasing of the password.
    const salt=await bcrypt.genSalt(10);
    const passwordHash= await bcrypt.hash(password,salt);

    const newUser= await prisma.user.create({
        data:{
            email,
            name,
            passwordHash
        },
    })

    //register also logs you in so we have to use the jwt token for authentication
    const token=jwt.sign({userId: newUser.id},process.env.JWT_SECRET,{expiresIn:'30d'});

    res.status(201).json({
        "message":"User is Successfully logged in",
        token,
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });

  } catch (error) {
    console.log(error),
    res.status(500).json({"error":"Internal Server Error"});
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Generate JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 4. Send Response
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    // req.user.id was securely injected by our 'protect' middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true } // Exclude the password hash!
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};