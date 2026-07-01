1. Project Name
# Issue Tracker API

2. Live URL
## Live URL

[b7-a2-ruddy.vercel.app](https://b7-a2-ruddy.vercel.app/)

## git-repo
  https://github.com/abir-11/Programming-Hero-Level2-assignment2.git

3. Features
## Features

- Create Issue
- Get All Issues
- Get Single Issue
- Update Issue
- Delete Issue
- Sort by Newest/Oldest
4. Tech Stack
## Tech Stack

- Node.js
- Express.js
- TypeScript
- PostgreSQL
- neon db
- pg
- dotenv
- cors
5. Setup Steps
## Installation


6. API Endpoint List
## API Endpoints

GET /api/issues

GET /api/issues/:id

POST /api/issues

PATCH /api/issues/:id

DELETE /api/issues/:id


GET /api/issues?sort=newest

GET /api/issues?status=oldest


7. Database Schema Summary
## Database Schema

Table: issues

id          SERIAL PRIMARY KEY

title       VARCHAR(150)

description TEXT (min>=20)

type        VARCHAR(50)

status      VARCHAR(50)

priority    VARCHAR(50)

created_at  TIMESTAMP
