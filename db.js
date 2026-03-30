require("dotenv").config();
const { Pool } = require("pg");

const useSSL = process.env.DB_SSLMODE === "require";

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSSL
    ? {
        rejectUnauthorized: false
      }
    : false
});

module.exports = pool;