

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";
import cors from "cors";

// src/modules/users/user.route.ts
import { Router } from "express";

// src/modules/users/user.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET,
  refresh_secret: process.env.JWT_REFRESH_TOKE_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
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
        `);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/users/user.service.ts
var creatUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
        INSERT INTO users(name,email,password,role) VALUES ($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
        `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var getAllUserService = async () => {
  const result = await pool.query(`
        SELECT * FROM users
        `);
  return result;
};
var userService = {
  creatUserIntoDB,
  getAllUserService
};

// src/modules/users/user.controller.ts
var createUser = async (req, res) => {
  try {
    const result = await userService.creatUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      data: error
    });
  }
};
var getAllUser = async (req, res) => {
  try {
    const result = await userService.getAllUserService();
    res.status(200).json({
      success: true,
      message: "Get all user fatch successfully",
      data: result.rows
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
      data: error
    });
  }
};
var userController = {
  createUser,
  getAllUser
};

// src/middleware/auth.ts
import jwt from "jsonwebtoken";
var auth = (...role) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized toke!!!"
        });
      }
      const decoded = jwt.verify(token, config_default.secret);
      console.log(decoded);
      const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
            `, [decoded.email]);
      console.log(userData);
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "user not found!!"
        });
      }
      if (role.length && !role.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!this role have no access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/modules/users/user.route.ts
var router = Router();
router.post("/signup", userController.createUser);
router.get("/signup", auth_default, userController.getAllUser);
var userRouter = router;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  const log = `
Method -> ${req.method} - Time -> ${Date.now()} - URL -> ${req.url}
`;
  fs.appendFile("logger.tex", log, (err) => {
  });
  next();
};
var logger_default = logger;

// src/modules/auth/auth.route.ts
import { Router as Router2 } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1

        `,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt2.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt2.sign(
    jwtpayload,
    config_default.secret,
    {
      expiresIn: "1d"
    }
  );
  const refreshToken2 = jwt2.sign(
    jwtpayload,
    config_default.refresh_secret,
    {
      expiresIn: "7d"
    }
  );
  const { password: _, ...userWithoutPassword } = user;
  return {
    token: accessToken,
    refreshToken: refreshToken2,
    user: userWithoutPassword
  };
};
var gererateFreshToken = async (token) => {
  if (!token) {
    throw new Error("Unathorized");
  }
  const decoded = jwt2.verify(token, config_default.refresh_secret);
  const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
            `, [decoded.email]);
  console.log(userData);
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found!!");
  }
  if (!user.is_active) {
    throw new Error("Forbidden");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt2.sign(
    jwtpayload,
    config_default.secret,
    {
      expiresIn: "1d"
    }
  );
  return { accessToken };
};
var authService = {
  loginUserIntoDB,
  gererateFreshToken
};

// src/modules/auth/auth.controller.ts
var logingUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { token, refreshToken: refreshToken2, user } = result;
    res.cookie("refreshToken", refreshToken2, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.gererateFreshToken(req.cookies.refreshToken);
    res.status(200).json({
      success: true,
      message: "access token generated",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      error
    });
  }
};
var authController = {
  logingUser,
  refreshToken
};

// src/modules/auth/auth.route.ts
var router2 = Router2();
router2.post("/login", authController.logingUser);
router2.post("/refresh-token", authController.refreshToken);
var authRouter = router2;

// src/modules/issues/issues.route.ts
import { Router as Router3 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
            INSERT INTO issues
            (title, description, type, reporter_id) VALUES($1, $2, $3, $4) RETURNING *
             `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
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
  const conditions = [];
  const values = [];
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
  sql += sort === "oldest" ? ` ORDER BY issues.created_at ASC` : ` ORDER BY issues.created_at DESC`;
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
      role: issue.role
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `
        SELECT * FROM issues 
        WHERE id=$1
        `,
    [id]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `
        SELECT id, name, role
        FROM users 
        WHERE id=$1
        `,
    [issue.reporter_id]
  );
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
        SELECT * FROM issues
        WHERE id=$1
        `,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error(
        "You can update only your own issue"
      );
    }
    if (issue.status !== "open") {
      throw new Error(
        "You cannot update this issue"
      );
    }
  }
  const { title, description, type, status } = payload;
  const result = await pool.query(
    `
        UPDATE issues 
        SET 
        title=$1,
        description=$2,
        type=$3,
        status=$4,
        updated_at=NOW()

        WHERE id=$5

        RETURNING *
        `,
    [
      title || issue.title,
      description || issue.description,
      type || issue.type,
      status || issue.status,
      issueId
    ]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (issueId) => {
  const issueResult = await pool.query(
    `
            SELECT * FROM issues
            WHERE id=$1
        `,
    [issueId]
  );
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const result = await pool.query(
    `
        DELETE FROM issues
        WHERE id=$1
        `,
    [issueId]
  );
  return result;
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporter_id = req.user.id;
    const result = await issuesService.createIssueIntoDB(
      req.body,
      reporter_id
    );
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var getAllIssue = async (req, res) => {
  try {
    const result = await issuesService.getAllIssuesFromDB(req.query);
    const { sort } = req.query;
    if (!sort) {
      return res.status(400).json({
        success: false,
        message: "sort query parameter is required"
      });
    }
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getSingleIssueFromDB(Number(id));
    res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const user = req.user;
    const result = await issuesService.updateIssueIntoDB(
      issueId,
      req.body,
      user
    );
    res.status(201).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const result = await issuesService.deleteIssueFromDB(issueId);
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
      error: err
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssue,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.route.ts
var router3 = Router3();
router3.post("/", auth_default("contributor", "maintainer"), issuesController.createIssue);
router3.get("/", issuesController.getAllIssue);
router3.get("/:id", issuesController.getSingleIssue);
router3.patch("/:id", auth_default("contributor", "maintainer"), issuesController.updateIssue);
router3.delete("/:id", auth_default("maintainer"), issuesController.deleteIssue);
var issuesRouter = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(logger_default);
var corsOptions = {
  origin: "http://localhost:3000"
};
app.use(cors(corsOptions));
app.use("/api/auth", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/issues", issuesRouter);
app.get("/", (req, res) => {
  res.send("Server is running!!!");
});
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map