import { Router } from "express";
import { userController } from "./user.controller";
import auth from "../../middleware/auth";


const router=Router();

router.post('/signup',userController.createUser);
router.get('/signup',auth,userController.getAllUser);

export const userRouter=router;