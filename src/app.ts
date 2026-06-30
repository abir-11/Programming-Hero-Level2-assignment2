import express, { type Application, type Request, type Response } from "express"
import { userRouter } from "./modules/users/user.route";
import logger from "./middleware/logger";
import { authRouter } from "./modules/auth/auth.route";
const app:Application = express()

app.use(express.json());
app.use(logger);

app.use('/api/auth',userRouter)
app.use('/api/auth', authRouter)
app.get('/', (req:Request, res:Response) => {
  res.send('Server is running!!!')
})

export default app;