const express = require("express");
const pool = require("../public/js/db");

const router = express.Router();

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
        acc.returns += row.returns;
        acc.discards += row.discards;
        return acc;
      },
      { sales: 0, voids: 0, returns: 0, discards: 0 }
    );

    res.json({
      success: true,
      date: dayString,
      rows,
      totals
    });
  } catch (error) {
    console.error("Failed to load X report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load X report."
    });
  }
});

router.get("/z/today", async (req, res) => {
  try {
    const alreadyGeneratedQuery =
      "SELECT 1 FROM z_report_log WHERE report_date = CURRENT_DATE";
    const generatedResult = await pool.query(alreadyGeneratedQuery);

    const totalsSql = `
      SELECT
        COUNT(*) AS c,
        COALESCE(SUM(total_price), 0) AS s,
        COALESCE(AVG(total_price), 0) AS a
      FROM orders
      WHERE DATE(order_datetime) = CURRENT_DATE
        AND is_complete = true
    `;

    const totalsResult = await pool.query(totalsSql);
    const totalsRow = totalsResult.rows[0] || { c: 0, s: 0, a: 0 };

    const paymentsSql = `
      SELECT
        COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown') AS method,
        COALESCE(SUM(total_price), 0) AS total
      FROM orders
      WHERE DATE(order_datetime) = CURRENT_DATE
        AND is_complete = true
      GROUP BY method
      ORDER BY total DESC
    `;

    const paymentResult = await pool.query(paymentsSql);

    res.json({
      success: true,
      alreadyGenerated: generatedResult.rowCount > 0,
      report: {
        orderCount: Number(totalsRow.c),
        totalSales: Number(totalsRow.s),
        avgOrder: Number(totalsRow.a),
        paymentTotals: paymentResult.rows.map((row) => ({
          method: row.method,
          total: Number(row.total)
        }))
      }
    });
  } catch (error) {
    console.error("Failed to load Z report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load Z report."
    });
  }
});

router.post("/z/generate", async (req, res) => {
  const generatedBy =
    req.body.generatedBy && String(req.body.generatedBy).trim() !== ""
      ? String(req.body.generatedBy).trim()
      : "Manager";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const alreadyGeneratedQuery =
      "SELECT 1 FROM z_report_log WHERE report_date = CURRENT_DATE FOR UPDATE";
    const alreadyGeneratedResult = await client.query(alreadyGeneratedQuery);

    if (alreadyGeneratedResult.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        error: "Z Report already generated today."
      });
    }

    const totalsSql = `
      SELECT
        COUNT(*) AS c,
        COALESCE(SUM(total_price), 0) AS s,
        COALESCE(AVG(total_price), 0) AS a
      FROM orders
      WHERE DATE(order_datetime) = CURRENT_DATE
        AND is_complete = true
    `;

    const totalsResult = await client.query(totalsSql);
    const totalsRow = totalsResult.rows[0] || { c: 0, s: 0, a: 0 };

    const paymentsSql = `
      SELECT
        COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown') AS method,
        COALESCE(SUM(total_price), 0) AS total
      FROM orders
      WHERE DATE(order_datetime) = CURRENT_DATE
        AND is_complete = true
      GROUP BY method
      ORDER BY total DESC
    `;

    const paymentsResult = await client.query(paymentsSql);

    const insertLogSql = `
      INSERT INTO z_report_log (report_date, generated_by)
      VALUES (CURRENT_DATE, $1)
    `;
    await client.query(insertLogSql, [generatedBy]);

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Z Report generated successfully.",
      report: {
        orderCount: Number(totalsRow.c),
        totalSales: Number(totalsRow.s),
        avgOrder: Number(totalsRow.a),
        paymentTotals: paymentsResult.rows.map((row) => ({
          method: row.method,
          total: Number(row.total)
        }))
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to generate Z report:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate Z report."
    });
  } finally {
    client.release();
  }
});

router.get("/trends", async (req, res) => {
  try {
    const limit = Math.max(1, Number(req.query.limit) || 5);
    const { start, end, dayString } = getDayBounds(req.query.date);

    const busiestSql = `
      SELECT
        date_trunc('hour', o.order_datetime::timestamp) AS hour_bucket,
        COUNT(*) AS cnt
      FROM orders o
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY hour_bucket
      ORDER BY cnt DESC
      LIMIT 1
    `;

    const slowestSql = `
      SELECT
        date_trunc('hour', o.order_datetime::timestamp) AS hour_bucket,
        COUNT(*) AS cnt
      FROM orders o
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY hour_bucket
      ORDER BY cnt ASC
      LIMIT 1
    `;

    const totalsSql = `
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_price), 0) AS total_revenue
      FROM orders o
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
    `;

    const topSellingSql = `
      SELECT
        oi.menu_id,
        SUM(oi.quantity) AS qty
      FROM orders o
      JOIN order_item oi ON oi.order_id = o.id
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY oi.menu_id
      ORDER BY qty DESC
      LIMIT $3
    `;

    const leastSellingSql = `
      SELECT
        oi.menu_id,
        SUM(oi.quantity) AS qty
      FROM orders o
      JOIN order_item oi ON oi.order_id = o.id
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY oi.menu_id
      ORDER BY qty ASC
      LIMIT $3
    `;

    const [
      busiestResult,
      slowestResult,
      totalsResult,
      topSellingResult,
      leastSellingResult
    ] = await Promise.all([
      pool.query(busiestSql, [start, end]),
      pool.query(slowestSql, [start, end]),
      pool.query(totalsSql, [start, end]),
      pool.query(topSellingSql, [start, end, limit]),
      pool.query(leastSellingSql, [start, end, limit])
    ]);

    function formatHourRange(value) {
      if (!value) return "--";

      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      const options = {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      };

      const startLabel = startDate.toLocaleTimeString("en-US", options);
      const endLabel = endDate.toLocaleTimeString("en-US", options);

      return `${startLabel}–${endLabel}`;
    }

    const busiest =
      busiestResult.rows.length > 0
        ? formatHourRange(busiestResult.rows[0].hour_bucket)
        : "--";

    const slowest =
      slowestResult.rows.length > 0
        ? formatHourRange(slowestResult.rows[0].hour_bucket)
        : "--";

    const totalsRow = totalsResult.rows[0] || {
      total_orders: 0,
      total_revenue: 0
    };

    const totalOrders = Number(totalsRow.total_orders || 0);
    const totalRevenue = Math.round(Number(totalsRow.total_revenue || 0) * 100) / 100;

    const topSelling = topSellingResult.rows.map((row) => {
      return `Menu ID: ${Number(row.menu_id)} (qty: ${Number(row.qty)})`;
    });

    const leastSelling = leastSellingResult.rows.map((row) => {
      return `Menu ID: ${Number(row.menu_id)} (qty: ${Number(row.qty)})`;
    });

    res.json({
      success: true,
      date: dayString,
      totalOrders,
      totalRevenue,
      busiest,
      slowest,
      topSelling,
      leastSelling
    });
  } catch (error) {
    console.error("Failed to load order trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load order trends."
    });
  }
});

module.exports = router;