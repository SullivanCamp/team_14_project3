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
      SELECT item_id, name, price, description
      FROM menu_item
      ORDER BY item_id
    `;

    const result = await pool.query(query);

    const drinks = [];
    const toppings = [];

    result.rows.forEach((row, index) => {
      const item = {
        item_id: Number(row.item_id),
        name: row.name,
        price: Number(row.price),
        description: row.description || "Freshly made and ready to customize."
      };

      if (Number(row.item_id) < 200) {
        let category = "all";

        if (drinks.length < 4) {
          category = "popular";
        } else if (drinks.length < 8) {
          category = "seasonal";
        }

        item.category = category;
        drinks.push(item);
      } else {
        toppings.push(item);
      }
    });

    res.json({
      success: true,
      items: drinks,
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