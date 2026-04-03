const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const router = express.Router();

const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: process.env.PSQL_PORT,
  ssl: { rejectUnauthorized: false }
});

router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT item_id, name, price
      FROM menu_item
      WHERE item_id < 200
      ORDER BY item_id
    `;

    const result = await pool.query(query);

    const items = result.rows.map((row, index) => {
      let category = "all";

      if (index < 4) {
        category = "popular";
      } else if (index < 8) {
        category = "seasonal";
      }

      return {
        item_id: Number(row.item_id),
        name: row.name,
        price: Number(row.price),
        category: category
      };
    });

    res.json({
      success: true,
      items: items
    });
  } catch (error) {
    console.error("Failed to load menu items:", error);

    res.status(500).json({
      success: false,
      error: "Failed to load menu items."
    });
  }
});

module.exports = router;