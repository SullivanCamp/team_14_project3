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
        SELECT DISTINCT mi.item_id, mi.name
        FROM menu_item mi
        JOIN menu_item_topping mit
            ON mi.item_id = mit.menu_item_id
        WHERE mit.is_topping = 't'
        ORDER BY mi.name
    `;

    const result = await pool.query(query);

    const toppings = result.rows.map((row) => ({
      inventory_id: Number(row.inventory_id),
      name: row.name
    }));

    res.json({
      success: true,
      toppings: toppings
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