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
const getAllIssuesFromDB = async (query: any) => {
    const { sort = "newest", type, status } = query;
    if (!sort) {
        throw new Error("sort query parameter is required");
    }
    let sql = `
    SELECT
      issues.id,
      issues.title,
      issues.description,
      issues.type,
      issues.status,
      issues.created_at,
      issues.updated_at,
      users.id AS reporter_id,
      users.name,
      users.role
    FROM issues
    JOIN users
      ON issues.reporter_id = users.id
  `;

    const conditions: string[] = [];
    const values: any[] = [];

    if (type) {
        values.push(type);
        conditions.push(`issues.type = $${values.length}`);
    }

    if (status) {
        values.push(status);
        conditions.push(`issues.status = $${values.length}`);
    }

    if (conditions.length) {
        sql += ` WHERE ` + conditions.join(" AND ");
    }

    sql +=
        sort === "oldest"
            ? ` ORDER BY issues.created_at ASC`
            : ` ORDER BY issues.created_at DESC`;

    const result = await pool.query(sql, values);

    return result.rows.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: {
            id: issue.reporter_id,
            name: issue.name,
            role: issue.role,
        },
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    }));
};

const getSingleIssueFromDB = async (id: number) => {
    // find the issue 
    const issueResult = await pool.query(
        `
        SELECT * FROM issues 
        WHERE id=$1
        `, [id]
    );

    if (issueResult.rows.length === 0) {
        throw new Error("Issue not found");
    }

    const issue = issueResult.rows[0];

    // reporter find
    const reporterResult = await pool.query(`
        SELECT id, name, role
        FROM users 
        WHERE id=$1
        `, [issue.reporter_id]
    );

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,

        reporter: reporterResult.rows[0],

        created_at: issue.created_at,
        updated_at: issue.updated_at,
    }
}


export const issuesService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    
}
