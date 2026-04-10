const express = require("express");
const pool = require("../public/js/db");

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    const { submissionType, item } = req.body;
    if (submissionType === "Edit") {
      const query = `
        UPDATE inventory_item
        SET name = $1, current_amount = $2, max_amount = $3, measurement_units = $4, cost_per_unit = $5, category = $6
        WHERE inventory_item_id = $7`;
      await client.query(query, [
        item.name,
        item.current,
        item.max,
        item.units,
        item.cost,
        item.category,
        item.itemId
      ]);
    } else if (submissionType === "Delete") {
      const query = `DELETE FROM inventory_item WHERE inventory_item_id = $1`;
      await client.query(query, [item.itemId]);
    }
    else if (submissionType === "Add") {
        const query1 = `SELECT MAX(inventory_item_id) AS max_id FROM inventory_item WHERE inventory_item_id < 500`;
        const result = await client.query(query1);
        const newId = parseInt(result.rows[0].max_id) + 1;

        const query2 = `
            INSERT INTO inventory_item (inventory_item_id, name, current_amount, max_amount, measurement_units, cost_per_unit, category)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
        await client.query(query2, [
            newId,
            item.name,
            item.current,
            item.max,
            item.units,
            item.cost,
            item.category
        ]);
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error processing inventory request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;