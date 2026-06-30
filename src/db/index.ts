import  { Pool } from "pg"
import config from "../config"

export const pool=new Pool({
    connectionString:config.connection_string,
})

export const initDB=async()=>{
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(300) NOT NULL,
            role VARCHAR(100) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )

            `);

         await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL CHECK (LENGTH(description) >= 20),

                type VARCHAR(30)
                CHECK (type IN ('bug', 'feature_request')),

                status VARCHAR(30)
                DEFAULT 'open'
                CHECK(status IN ('open', 'in_progress', 'resolved')),

                reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `)

            
              console.log("Database connected successfully");

    } catch (error) {
              console.log(error);
    }
};