import express, { type Application, type Request, type Response } from "express"
import { userRouter } from "./users/user.route";
const app:Application = express()

app.use(express.json());

app.use('/api/auth',userRouter)

app.get('/', (req:Request, res:Response) => {
  res.send('Server is running!!!')
})

export default app;