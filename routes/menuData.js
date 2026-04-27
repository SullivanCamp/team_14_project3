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
    const drinksQuery = `
      SELECT item_id, name, price, description, COALESCE(category, 'all') AS category
      FROM menu_item
      WHERE item_id < 200
      ORDER BY item_id
    `;

    const toppingsQuery = `
      SELECT DISTINCT m.item_id, m.name, m.price, m.description
      FROM menu_item m
      JOIN menu_item_topping mt
        ON mt.menu_item_id = m.item_id
      WHERE mt.is_topping = true
      ORDER BY m.item_id
    `;

    const drinksResult = await pool.query(drinksQuery);
    const toppingsResult = await pool.query(toppingsQuery);

    const items = drinksResult.rows.map((row) => {
      return {
        item_id: Number(row.item_id),
        name: row.name,
        price: Number(row.price),
        description: row.description || "Freshly made and ready to customize.",
        category: row.category || "all"
      };
    });

    const toppings = toppingsResult.rows.map((row) => {
      return {
        item_id: Number(row.item_id),
        name: row.name,
        price: Number(row.price),
        description: row.description || ""
      };
    });

    res.json({
      success: true,
      items: items,
      toppings: toppings
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