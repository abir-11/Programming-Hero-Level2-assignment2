import { Router } from "express";
import { authController } from "./auth.controller";


const router=Router();

router.post('/login',authController.logingUser);
router.post('/refresh-token',authController.refreshToken)

export const authRouter=router;