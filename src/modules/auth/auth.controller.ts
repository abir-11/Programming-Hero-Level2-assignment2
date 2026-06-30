import type { Request, Response } from "express"
import { authService } from "./auth.service"


const logingUser = async (req: Request, res: Response) => {
    try {
        const result = await authService.loginUserIntoDB(req.body);

        const { token, refreshToken, user } = result;

        res.cookie("refreshToken", refreshToken, {
            secure: false,
            httpOnly: true,
            sameSite: "lax",
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const refreshToken=async(req: Request, res: Response)=>{
try {
      const result=await authService.gererateFreshToken(req.cookies.refreshToken);
  res.status(200).json({
            success: true,
            message: "access token generated",
            data: result,
        })
    } catch (error: any) {
        res.status(500).json({
            message: error.message,
            error: error
        })

    }

}

export const authController = {
    logingUser,
    refreshToken
} 