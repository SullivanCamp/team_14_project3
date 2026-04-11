require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.PSQL_HOST,
  port: Number(process.env.PSQL_PORT),
  database: process.env.PSQL_DATABASE,
  user: process.env.PSQL_USER,
  password: process.env.PSQL_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;