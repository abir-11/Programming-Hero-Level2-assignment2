import { pool } from "../../db";
import type { Iissues } from "./issues.interface";

//create
const createIssueIntoDB = async (payload: Iissues, reporter_id: number) => {
    const { title, description, type } = payload;

    const result = await pool.query(`
            INSERT INTO issues
            (title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
             `, [title, description, type, reporter_id]
    )

    return result.rows[0]
};

//get all issues



export const issuesService = {
    createIssueIntoDB
}
