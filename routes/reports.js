const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: Number(process.env.PSQL_PORT),
  ssl: { rejectUnauthorized: false }
});

function getDayBounds(dateString) {
  const day = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");

  const start = `${year}-${month}-${date} 00:00:00`;

  const endDate = new Date(day);
  endDate.setDate(endDate.getDate() + 1);

  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");

  const end = `${endYear}-${endMonth}-${endDay} 00:00:00`;

  return {
    start,
    end,
    dayString: `${year}-${month}-${date}`
  };
}

router.get("/x", async (req, res) => {
  try {
    const { start, end, dayString } = getDayBounds(req.query.date);

    const sql = `
      SELECT
        EXTRACT(HOUR FROM o.order_datetime::timestamp) AS hr,
        COALESCE(SUM(CASE WHEN o.is_complete THEN o.total_price ELSE 0 END), 0) AS sales,
        COALESCE(SUM(CASE WHEN NOT o.is_complete THEN 1 ELSE 0 END), 0) AS voids
      FROM orders o
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY hr
      ORDER BY hr
    `;

    const result = await pool.query(sql, [start, end]);

    const rows = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      voids: 0,
      returns: 0,
      discards: 0
    }));

    for (const row of result.rows) {
      const hour = Number(row.hr);
      if (hour >= 0 && hour < 24) {
        rows[hour] = {
          hour,
          sales: Number(row.sales),
          voids: Number(row.voids),
          returns: 0,
          discards: 0
        };
      }
    }

    const totals = rows.reduce(
      (acc, row) => {
        acc.sales += row.sales;
        acc.voids += row.voids;
        return acc;
      },
      { sales: 0, voids: 0 }
    );

    res.json({
      success: true,
      date: dayString,
      rows,
      totals
    });
  } catch (error) {
    console.error("Failed to load X report:", error);
    res.status(500).json({ success: false, error: "Failed to load X report." });
  }
});

router.get("/z/today", async (req, res) => {
  try {
    const totalsSql = `
      SELECT COUNT(*) AS c,
             COALESCE(SUM(total_price), 0) AS s,
             COALESCE(AVG(total_price), 0) AS a
      FROM orders
      WHERE DATE(order_datetime) = CURRENT_DATE
        AND is_complete = true
    `;

    const totalsResult = await pool.query(totalsSql);
    const totalsRow = totalsResult.rows[0] || { c: 0, s: 0, a: 0 };

    res.json({
      success: true,
      report: {
        orderCount: Number(totalsRow.c),
        totalSales: Number(totalsRow.s),
        avgOrder: Number(totalsRow.a)
      }
    });
  } catch (error) {
    console.error("Failed to load Z report:", error);
    res.status(500).json({ success: false, error: "Failed to load Z report." });
  }
});

router.get("/trends", async (req, res) => {
  try {
    const { start, end } = getDayBounds(req.query.date);

    const totalsSql = `
      SELECT COUNT(*) AS total_orders,
             COALESCE(SUM(total_price), 0) AS total_revenue
      FROM orders
      WHERE order_datetime >= $1 AND order_datetime < $2
    `;

    const result = await pool.query(totalsSql, [start, end]);

    res.json({
      success: true,
      totalOrders: Number(result.rows[0].total_orders),
      totalRevenue: Number(result.rows[0].total_revenue)
    });
  } catch (error) {
    console.error("Failed to load trends:", error);
    res.status(500).json({ success: false });
  }
});

router.get("/product-usage", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Missing dates" });
  }

  try {
    const query = `
      SELECT 
        ii.inventory_item_id, 
        ii.name, 
        ii.measurement_units, 
        SUM(oi.quantity * im.quantity_used) AS total_used
      FROM orders o
      JOIN order_item oi ON oi.order_id = o.id
      JOIN inventory_menu im ON im.menu_item_id = oi.menu_id
      JOIN inventory_item ii ON ii.inventory_item_id = im.inventory_item_id
      WHERE o.order_datetime >= $1
      AND o.order_datetime < $2
      AND o.is_complete = TRUE
      GROUP BY ii.inventory_item_id, ii.name, ii.measurement_units
      ORDER BY total_used DESC;
    `;

    const result = await pool.query(query, [
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error("Product usage error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;