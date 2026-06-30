import type { Request, Response } from "express";
import { userService } from "./user.service";



const createUser=async(req:Request,res:Response)=>{
    try {
        const result=await userService.creatUserIntoDB(req.body);
        res.status(201).json({
            success:true,
            message:"User registered successfully",
            data:result.rows[0]
        })
    } catch (error:any) {
         res.status(500).json({
            success:false,
            message:error.message,
            data:error
        })
    }

   
}

const getAllUser=async(req:Request,res:Response)=>{
    try {
        const result=await userService.getAllUserService();

          res.status(200).json({
            success:true,
            message:"Get all user fatch successfully",
            data:result.rows
        })

    } catch (error:any) {
        res.status(404).json({
            success:false,
            message:error.message,
            data:error
        })
    }
}

 export const userController={
        createUser,
        getAllUser
    }