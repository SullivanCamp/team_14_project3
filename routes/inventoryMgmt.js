const express = require("express");
const pool = require("../public/js/db");

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { submissionType, item } = req.body;
    await client.query('BEGIN');


    if (submissionType === "Edit") {
      const query1 = `
        UPDATE inventory_item
        SET name = $1, current_amount = $2, max_amount = $3, measurement_units = $4, cost_per_unit = $5, category = $6
        WHERE inventory_item_id = $7`;
      const query2 = `
        UPDATE menu_item
        SET name = $1
        WHERE item_id = $2`;
      await client.query(query1, [
        item.name,
        item.current,
        item.max,
        item.units,
        item.cost,
        item.category,
        item.itemId
      ]);
      await client.query(query2, [
        item.name,
        item.itemId
      ]);

    } else if (submissionType === "Delete") {
      const query1 = `DELETE FROM inventory_item WHERE inventory_item_id = $1`;
      const query2 = `DELETE FROM menu_item WHERE item_id = $1`;
      await client.query(query1, [item.itemId]);
      await client.query(query2, [item.itemId]);
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

        if (newId <= 500 && newId >= 200) {
          const query3 = `
              INSERT INTO menu_item (item_id, name, price)
              VALUES ($1, $2, $3)
          `;
          await client.query(query3, [
              newId,
              item.name,
              .50
          ]);
        }
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