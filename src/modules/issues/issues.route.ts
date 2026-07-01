import { Router } from "express";
import { issuesController } from "./issues.controller.js";
import auth from "../../middleware/auth.js";

const router = Router();

router.post("/", auth("contributor", "maintainer"), issuesController.createIssue);

router.get("/", issuesController.getAllIssue);
router.get("/:id", issuesController.getSingleIssue);
router.patch("/:id", auth("contributor", "maintainer"), issuesController.updateIssue);
 
export const issuesRouter = router;