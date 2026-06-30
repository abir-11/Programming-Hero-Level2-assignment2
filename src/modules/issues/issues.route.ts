import { Router } from "express";
import { issuesController } from "./issues.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/", auth("contributor", "maintainer"), issuesController.createIssue);




 
export const issuesRouter = router;