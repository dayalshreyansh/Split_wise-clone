import express from 'express';
import { checkUser } from '../controller/user.controller.js';

const router=express.Router();

router.get('/checkUser',checkUser);

export default router;
