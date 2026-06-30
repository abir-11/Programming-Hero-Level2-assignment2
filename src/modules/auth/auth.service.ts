import bcrypt from "bcryptjs";
import { pool } from "../../db";
import config from "../../config";
import jwt, { type JwtPayload } from "jsonwebtoken"


const loginUserIntoDB = async (payload: {
    email: string,
    password: string
}) => {
    const { email, password } = payload;

    const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1

        `, [email]
    );
    if (userData.rows.length === 0) {
        throw new Error("Invalid Credentials!")
    }
    const user = userData.rows[0];

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
        throw new Error("Invalid Credentials!");
    }

    //generate token
    const jwtpayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }

    const accessToken = jwt.sign(jwtpayload, config.secret as string,
        {
            expiresIn: "1d",
        }
    )
    const refreshToken = jwt.sign(jwtpayload, config.refresh_secret as string,
        {
            expiresIn: "7d",
        }
    )
    const { password: _, ...userWithoutPassword } = user;
    return {
        token: accessToken, refreshToken,
        user: userWithoutPassword
    };
};

const gererateFreshToken = async (token: string) => {

    if (!token) {
        throw new Error("Unathorized");
    }
    const decoded = jwt.verify(token as string, config.refresh_secret as string) as JwtPayload;

    const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
            `, [decoded.email]);
    console.log(userData);

    const user = userData.rows[0];
    if (userData.rows.length === 0) {
        throw new Error("User not found!!")
    }
    if (!user.is_active) {
        throw new Error("Forbidden")
    }
    const jwtpayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role

    }

    const accessToken = jwt.sign(jwtpayload, config.secret as string,
        {
            expiresIn: "1d",
        }
    )

    return { accessToken }


}

export const authService = {
    loginUserIntoDB,
    gererateFreshToken
}