import express, { type Application, type Request, type Response } from "express"
import cors from "cors"
import { userRouter } from "./modules/users/user.route";
import logger from "./middleware/logger";
import { authRouter } from "./modules/auth/auth.route";
import { issuesRouter } from "./modules/issues/issues.route";
const app: Application = express()

app.use(express.json());
app.use(logger);
const corsOptions = {
  origin: 'http://localhost:3000',
}
app.use(cors(corsOptions));

app.use('/api/auth', userRouter)
app.use('/api/auth', authRouter)
app.use("/api/issues", issuesRouter)
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running!!!')
})

export default app;