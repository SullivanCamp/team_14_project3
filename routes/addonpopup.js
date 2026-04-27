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

//this gets all of the toppings that have t in the is_topping column inside of the database
router.get("/toppings", async (req, res) => {
  try {
    const query = `
      SELECT inventory_item_id, name, category
      FROM inventory_item
      WHERE category IN ('Topping')
      ORDER BY name;
    `;

    const result = await pool.query(query);

    const toppings = result.rows.map((row) => ({
      inventory_id: Number(row.inventory_item_id),
      name: row.name,
      category: row.category
    }));

    res.json({
      success: true,
      toppings
    });
  } catch (error) {
    console.error("Failed to load toppings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load toppings."
    });
  }
});

module.exports = router;