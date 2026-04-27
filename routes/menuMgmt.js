const express = require("express");
const pool = require('../db'); 

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { submissionType, item } = req.body;
    if (submissionType === "Edit") {
      const query = `
        UPDATE menu_item
        SET name = $1, price = $2, category = $3, description = $4
        WHERE item_id = $5`;
      await client.query(query, [
        item.name,
        item.price,
        item.category,
        item.description,
        item.itemId
      ]);
    } else if (submissionType === "Delete") {
      const query = `DELETE FROM menu_item WHERE item_id = $1`;
      await client.query(query, [item.itemId]);
    }
    else if (submissionType === "Add") {
        const query1 = `SELECT MAX(item_id) AS max_id FROM menu_item WHERE item_id < 200`;
        const result = await client.query(query1);
        const newId = parseInt(result.rows[0].max_id) + 1;

        const query2 = `
            INSERT INTO menu_item (item_id, name, price, category, description)
            VALUES ($1, $2, $3, $4, $5)
            `;
        await client.query(query2, [
            newId,
            item.name,
            item.price,
            item.category,
            item.description
        ]);
    }
    else if (submissionType === "AddIngredient") {
        const query1 = `SELECT MAX(id) AS max_id FROM inventory_menu`;
        const result = await client.query(query1);
        const newId = parseInt(result.rows[0].max_id) + 1;

        const query2 = `
            INSERT INTO inventory_menu (id, inventory_item_id, menu_item_id, quantity_used)
            VALUES ($1, $2, $3, $4)
            `;
        await client.query(query2, [
            parseInt(newId),
            parseInt(item.inventory_item_id),
            parseInt(item.menu_item_id),
            parseFloat(item.quantity_used)
        ]);
    }
    else if (submissionType === "DeleteIngredient") {
        const query = `DELETE FROM inventory_menu WHERE menu_item_id = $1 AND inventory_item_id = $2`;
        await client.query(query, [item.menu_item_id, item.inventory_item_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error processing menu request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;