import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
    try {
        const reporter_id = req.user!.id;

        const result = await issuesService.createIssueIntoDB(
            req.body,
            reporter_id
        );

        res.status(201).json({
            success: true,
            message: "Issue created successfully",
            data: result
        });
    }
    catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: err,
        });
    }
};
//get all
const getAllIssue = async (req: Request, res: Response) => {
    try {
        const result = await issuesService.getAllIssuesFromDB(req.query);

        const { sort } = req.query;

        if (!sort) {
            return res.status(400).json({
                success: false,
                message: "sort query parameter is required",
            });
        }

        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: err,
        });
    }
}

const getSingleIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await issuesService.getSingleIssueFromDB(Number(id));

        res.status(200).json({
            success: true,
            message:"Issue retrived successfully",
            data: result,
        });
    }
    catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: err,
        });
    }
};
const updateIssue = async(req: Request, res: Response) => {
    try{
        const issueId = Number(req.params.id);

        const user = req.user!;

        const result = await issuesService.updateIssueIntoDB(
            issueId,
            req.body,
            user
        );

        res.status(201).json({
            success: true,
            message: "Issue updated successfully",
            data: result,
        });
    }
    catch(err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: err,
        });
    }
};


export const issuesController = {
    createIssue,
    getAllIssue,
    getSingleIssue,
    updateIssue
}