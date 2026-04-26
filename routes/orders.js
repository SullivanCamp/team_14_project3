const express = require("express");
const pool = require('../db'); 

const router = express.Router();
  
function calculatePointsFromTotal(totalPrice) {
  return Math.floor(Number(totalPrice) || 0);
}

function getTierFromPoints(points) {
  const pts = Number(points) || 0;

  if (pts >= 300) return "Gold";
  if (pts >= 150) return "Silver";
  return "Standard";
}

async function applyRewards(client, customerId, totalPrice, rewardRedemption) {
  if (!customerId) {
    return null;
  }

  const earnedPoints = Math.floor(Number(totalPrice || 0));

  let redeemedPoints = 0;

  if (rewardRedemption) {
    redeemedPoints = Number(rewardRedemption.pointsCost || 0);
  }

  const currentRewardResult = await client.query(
    `
    SELECT points, tier
    FROM customer_rewards
    WHERE customer_id = $1
    FOR UPDATE
    `,
    [customerId]
  );

  if (currentRewardResult.rows.length === 0) {
    throw new Error("Customer rewards account not found.");
  }

  const currentPoints = Number(currentRewardResult.rows[0].points || 0);

  if (redeemedPoints > 0 && currentPoints < redeemedPoints) {
    throw new Error("Customer does not have enough points for this reward.");
  }

  const newPoints = currentPoints - redeemedPoints + earnedPoints;

  let newTier = "Standard";

  if (newPoints >= 500) {
    newTier = "Gold";
  } else if (newPoints >= 250) {
    newTier = "Silver";
  }

  await client.query(
    `
    UPDATE customer_rewards
    SET points = $1,
        tier = $2
    WHERE customer_id = $3
    `,
    [newPoints, newTier, customerId]
  );

  return {
    earnedPoints,
    redeemedPoints,
    totalPoints: newPoints,
    tier: newTier
  };
}

async function nextId(client, tableName) {
  const query = `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM ${tableName}`;
  const result = await client.query(query);
  return Number(result.rows[0].next_id);
}

async function insertOrder(client, totalPrice, paymentMethod) {
  const id = await nextId(client, "orders");

  const safePaymentMethod =
    paymentMethod && String(paymentMethod).trim() !== ""
      ? paymentMethod
      : "Unknown";

  const query = `
    INSERT INTO orders (
      id,
      total_price,
      employee_first_name,
      order_datetime,
      is_complete,
      payment_method
    )
    VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Chicago', TRUE, $4)
  `;

  await client.query(query, [
    id,
    Number(totalPrice).toFixed(2),
    "Kiosk",
    safePaymentMethod
  ]);

  return id;
}

async function insertOrderItem(client, orderId, menuId, quantity) {
  const id = await nextId(client, "order_item");

  const query = `
    INSERT INTO order_item (id, menu_id, order_id, quantity)
    VALUES ($1, $2, $3, $4)
  `;

  await client.query(query, [id, menuId, orderId, quantity]);
  return id;
}

async function insertMenuItemTopping(client, menuItemId, orderItemId, isTopping, qty) {
  const id = await nextId(client, "menu_item_topping");

  const query = `
    INSERT INTO menu_item_topping (id, menu_item_id, order_item_id, is_topping, quantity)
    VALUES ($1, $2, $3, $4, $5)
  `;

  await client.query(query, [id, menuItemId, orderItemId, isTopping, qty]);
  return id;
}

async function checkAndDecrementInventoryForCart(client, cart) {
  const SUGAR_ID = 217;
  const ICE_ID = 206;

  const need = new Map();

  for (const line of cart) {
    let sugarPct = 100;
    let icePct = 100;

    if (line.sugar >= 0) sugarPct = Number(line.sugar);
    if (line.ice >= 0) icePct = Number(line.ice);

    const recipeQuery = `
      SELECT inventory_item_id, quantity_used
      FROM inventory_menu
      WHERE menu_item_id = $1
    `;

    const recipeResult = await client.query(recipeQuery, [line.itemId]);

    for (const row of recipeResult.rows) {
      const invId = Number(row.inventory_item_id);
      let used = Number(row.quantity_used) * Number(line.qty);

      if (invId === SUGAR_ID) used *= sugarPct / 100.0;
      if (invId === ICE_ID) used *= icePct / 100.0;

      need.set(invId, (need.get(invId) || 0) + used);
    }

    if (line.toppings && Array.isArray(line.toppings)) {
      for (const topping of line.toppings) {
        const invId = Number(topping.id);
        const used = Number(topping.qty) * Number(line.qty);
        need.set(invId, (need.get(invId) || 0) + used);
      }
    }
  }

  if (need.size === 0) return;

  const ids = Array.from(need.keys());
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");

  const lockQuery = `
    SELECT inventory_item_id, name, current_amount
    FROM inventory_item
    WHERE inventory_item_id IN (${placeholders})
    FOR UPDATE
  `;

  const lockResult = await client.query(lockQuery, ids);

  const have = new Map();
  const names = new Map();

  for (const row of lockResult.rows) {
    const id = Number(row.inventory_item_id);
    have.set(id, Number(row.current_amount));
    names.set(id, row.name);
  }

  let message = "";

  for (const id of ids) {
    const needAmt = Number(need.get(id) || 0);
    const haveAmt = Number(have.get(id) || 0);

    if (haveAmt < needAmt) {
      const itemName = names.get(id) || `Item ${id}`;
      message += `- ${itemName} is out of stock or does not have enough remaining.\n`;
    }
  }

  if (message.length > 0) {
    throw new Error(`Not enough inventory:\n\n${message}`);
  }

  const updateQuery = `
    UPDATE inventory_item
    SET current_amount = current_amount - $1
    WHERE inventory_item_id = $2
  `;

  for (const id of ids) {
    await client.query(updateQuery, [need.get(id), id]);
  }
}

router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      employeeFirstName,
      totalPrice,
      paymentMethod,
      customerId,
      cart,
      rewardRedemption
    } = req.body;

    console.log("Incoming order payload:", JSON.stringify(req.body, null, 2));

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Your cart is empty."
      });
    }

    await client.query("BEGIN");

    const orderId = await insertOrder(client, totalPrice, paymentMethod);

    for (const line of cart) {
      const orderItemId = await insertOrderItem(
        client,
        orderId,
        line.itemId,
        line.qty
      );

      if (line.toppings && Array.isArray(line.toppings)) {
        for (const topping of line.toppings) {
          await insertMenuItemTopping(
            client,
            topping.id,
            orderItemId,
            true,
            topping.qty
          );
        }
      }
    }

    await checkAndDecrementInventoryForCart(client, cart);
    const rewardsResult = await applyRewards(
      client,
      customerId,
      totalPrice,
      rewardRedemption
    );

    await client.query("COMMIT");

    console.log("Order committed successfully:", orderId);

    res.status(201).json({
      success: true,
      message: "Order submitted successfully.",
      orderId,
      rewards: rewardsResult
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Order submission failed:", error);

    const message = error.message || "Failed to submit order.";

    if (message.startsWith("Not enough inventory:")) {
      return res.status(409).json({
        success: false,
        error: message
      });
    }

    return res.status(500).json({
      success: false,
      error: message
    });
  } finally {
    client.release();
  }
});

module.exports = router;