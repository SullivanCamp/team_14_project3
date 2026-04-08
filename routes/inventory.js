const express = require("express");
const pool = require("../public/js/db");
const { route } = require("./orders");

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    const { submissionType, item } = req.body;
    if (submissionType === "Edit") {
      const query = `
        UPDATE inventory_item
        SET name = $1, current_amount = $2, max_amount = $3, measurement_units = $4, cost_per_unit = $5
        WHERE inventory_item_id = $6
      `;
      await client.query(query, [
        item.name,
        item.current,
        item.max,
        item.units,
        item.cost,
        item.itemId
      ]);
    } else if (submissionType === "Delete") {
      const query = `DELETE FROM inventory WHERE item_id = $1`;
      await client.query(query, [item.itemId]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error processing inventory request:", error);
    res.json({ success: false });
  } finally {
    client.release();
  }
});

module.exports = router;